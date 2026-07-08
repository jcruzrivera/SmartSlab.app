import type Stripe from "stripe";

import {
  attachPaymentIntent,
  getTransactionEmailData,
  markTransactionPaid,
} from "@/lib/db/transactions";
import { createNotification } from "@/lib/db/notifications";
import { sendPaymentNotifications } from "@/lib/email";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function money(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `$${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

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
      const slabUrl = `${base}/slab/${data.slabId}`;

      await sendPaymentNotifications({
        slabName: data.slabName,
        total: data.total,
        vendorPayout: data.vendorPayout,
        platformFee: data.platformFee,
        buyer: data.buyer,
        vendor: data.vendor,
        slabUrl,
      });

      // In-app notifications mirror the emails. Best-effort, never blocking.
      await Promise.all([
        createNotification({
          userId: data.buyerId,
          type: "purchase",
          title: "Payment confirmed",
          body: `Your payment of ${money(data.total)} for ${data.slabName} was received.`,
          link: `/slab/${data.slabId}`,
        }),
        createNotification({
          userId: data.vendorId,
          type: "sale",
          title: "You made a sale",
          body: `${data.slabName} sold. Your payout: ${money(data.vendorPayout)}.`,
          link: "/dashboard/sales",
        }),
      ]);
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
