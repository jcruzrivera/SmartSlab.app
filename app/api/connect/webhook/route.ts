import { NextResponse } from "next/server";

import { setVendorVerified } from "@/lib/db/users";
import {
  getAccountStatus,
  getStripeClient,
  isStripeConfigured,
} from "@/lib/stripe-connect";

// Stripe must receive the raw, unparsed body to verify the signature.
export const runtime = "nodejs";

/**
 * Webhook endpoint for Account v2 "thin" events.
 *
 * Configure an event destination in the Stripe Dashboard (Developers →
 * Webhooks → Add destination) with:
 *   - Events from: Connected accounts
 *   - Payload style: Thin
 *   - Events:
 *       v2.core.account[requirements].updated
 *       v2.core.account[configuration.recipient].capability_status_updated
 *
 * Then set the signing secret:
 *   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_********************************
 *
 * Locally, forward thin events with the Stripe CLI:
 *   stripe listen \
 *     --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' \
 *     --forward-thin-to localhost:3000/api/connect/webhook
 */
export async function POST(request: Request): Promise<NextResponse> {
  // PLACEHOLDER: set this in your environment (see header comment).
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!isStripeConfigured() || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Connect webhook is not configured (missing STRIPE_SECRET_KEY or STRIPE_CONNECT_WEBHOOK_SECRET).",
      },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripeClient = getStripeClient();

  // Verify the signature and parse the thin event notification. Thin events
  // carry only identifiers; we fetch the full event/object from the API.
  let notification: Awaited<
    ReturnType<typeof stripeClient.parseEventNotificationAsync>
  >;

  try {
    notification = await stripeClient.parseEventNotificationAsync(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid webhook signature.",
      },
      { status: 400 },
    );
  }

  try {
    switch (notification.type) {
      case "v2.core.account[requirements].updated":
      case "v2.core.account[configuration.recipient].capability_status_updated": {
        // The related object is the affected connected account. Fetching it
        // gives us the latest requirements/capabilities so we can prompt the
        // seller to resolve anything that is newly "currently_due"/"past_due".
        const relatedObject = await notification.fetchRelatedObject();
        const accountId =
          relatedObject && typeof relatedObject === "object" && "id" in relatedObject
            ? String((relatedObject as { id: unknown }).id)
            : null;

        if (accountId) {
          // Keep the vendor's verified flag in sync with their live payout
          // readiness. The onboarding/payments pages also read status live, but
          // persisting it powers the dashboard verification badge without an
          // extra API call on every render.
          const status = await getAccountStatus(accountId);
          await setVendorVerified(accountId, status.readyToReceivePayments);
        }
        break;
      }

      default:
        // Acknowledge any other event types without acting on them.
        break;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook handler failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
