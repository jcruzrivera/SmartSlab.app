import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { releaseTransaction } from "@/lib/db/transactions";
import {
  cancelUserSubscription,
  setVendorVerified,
  syncUserSubscription,
} from "@/lib/db/users";
import { fulfillTransaction } from "@/lib/payments/fulfill";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Stripe webhook (`POST /api/webhooks/stripe`).
 *
 * Billing subscription events (configure these in the Stripe Dashboard):
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 *
 * Marketplace / Connect events handled separately in the same endpoint.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!isStripeConfigured() || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const transactionId = session.metadata?.transactionId;

        if (transactionId) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined;
          await fulfillTransaction(transactionId, { paymentIntentId });
        }
        break;
      }

      case "checkout.session.expired": {
        // Buyer didn't pay within the window — free the reserved slab.
        const session = event.data.object as Stripe.Checkout.Session;
        const transactionId = session.metadata?.transactionId;
        if (transactionId) {
          await releaseTransaction(transactionId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        // Payment attempt failed — release the reservation so others can buy.
        const intent = event.data.object as Stripe.PaymentIntent;
        const transactionId = intent.metadata?.transactionId;
        if (transactionId) {
          await releaseTransaction(transactionId);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const isReady = Boolean(
          account.charges_enabled && account.payouts_enabled,
        );
        await setVendorVerified(account.id, isReady);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerk_id;
        if (!clerkId) {
          break;
        }

        await syncUserSubscription({
          clerkId,
          stripeSubscriptionId: sub.id,
          stripeStatus: sub.status,
          planMetadata: sub.metadata?.plan,
          currentPeriodEnd: Number(
            (sub as Stripe.Subscription & { current_period_end: number })
              .current_period_end,
          ),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerk_id;
        if (!clerkId) {
          break;
        }

        await cancelUserSubscription(clerkId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id ?? null;

        if (!subscriptionId) {
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const clerkId = sub.metadata?.clerk_id;
        if (!clerkId) {
          break;
        }

        await syncUserSubscription({
          clerkId,
          stripeSubscriptionId: sub.id,
          stripeStatus: sub.status,
          planMetadata: sub.metadata?.plan,
          currentPeriodEnd: Number(
            (sub as Stripe.Subscription & { current_period_end: number })
              .current_period_end,
          ),
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook handler failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
