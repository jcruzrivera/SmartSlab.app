import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { releaseTransaction } from "@/lib/db/transactions";
import { fulfillTransaction } from "@/lib/payments/fulfill";
import { setVendorVerified } from "@/lib/db/users";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

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
