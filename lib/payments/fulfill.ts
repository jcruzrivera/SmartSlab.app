import type Stripe from "stripe";

import {
  attachPaymentIntent,
  getTransactionEmailData,
  markTransactionPaid,
} from "@/lib/db/transactions";
import { sendPaymentNotifications } from "@/lib/email";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Marks a transaction paid and, only on the pending -> paid transition, emails
 * the buyer, the vendor, and the platform. Safe to call repeatedly (webhook
 * retries + the success-page fallback both route through here).
 */
export async function fulfillTransaction(
  transactionId: string,
  options: { paymentIntentId?: string; origin?: string } = {},
): Promise<void> {
  if (options.paymentIntentId) {
    await attachPaymentIntent(transactionId, options.paymentIntentId);
  }

  const transitioned = await markTransactionPaid(transactionId);
  if (!transitioned) {
    return;
  }

  try {
    const data = await getTransactionEmailData(transactionId);
    if (data) {
      const base = options.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendPaymentNotifications({
        slabName: data.slabName,
        total: data.total,
        vendorPayout: data.vendorPayout,
        platformFee: data.platformFee,
        buyer: data.buyer,
        vendor: data.vendor,
        slabUrl: `${base}/slab/${data.slabId}`,
      });
    }
  } catch (error) {
    // Notifications must never block fulfillment.
    console.error("[fulfill] notification error:", error);
  }
}

/**
 * Fallback used when the buyer returns from Stripe Checkout. Verifies the
 * session is actually paid, then fulfills it — so the order completes even if
 * the webhook is delayed or not configured yet.
 */
export async function fulfillCheckoutSession(
  sessionId: string,
  origin?: string,
): Promise<boolean> {
  if (!isStripeConfigured()) {
    return false;
  }

  const stripe = getStripe();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("[fulfill] could not retrieve session:", error);
    return false;
  }

  if (session.payment_status !== "paid") {
    return false;
  }

  const transactionId = session.metadata?.transactionId;
  if (!transactionId) {
    return false;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : undefined;

  await fulfillTransaction(transactionId, { paymentIntentId, origin });
  return true;
}
