"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";

import {
  computeApplicationFee,
  getStripeClient,
  isStripeConfigured,
} from "@/lib/stripe-connect";
import { getOrigin } from "@/lib/url";

export type CheckoutState = { error?: string };

/**
 * Starts a hosted Checkout session for a single product using a DESTINATION
 * CHARGE: the platform creates the charge, takes an application fee, and routes
 * the remainder to the connected account that owns the product.
 */
export async function startCheckout(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." };
  }

  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId) {
    return { error: "Missing product." };
  }

  const stripeClient = getStripeClient();

  // Re-read the product server-side so price and destination can't be tampered
  // with from the client.
  const product = await stripeClient.products.retrieve(productId, {
    expand: ["default_price"],
  });

  const price = product.default_price as Stripe.Price | null;
  const destination = product.metadata?.connectedAccountId;

  if (!price || price.unit_amount == null) {
    return { error: "This product has no price." };
  }

  if (!destination) {
    return { error: "This product is not linked to a connected account." };
  }

  const origin = await getOrigin();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      payment_intent_data: {
        // Platform's cut of this transaction.
        application_fee_amount: computeApplicationFee(price.unit_amount),
        // Route the remaining funds to the seller's connected account.
        transfer_data: { destination },
      },
      success_url: `${origin}/connect/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/connect/store?canceled=1`,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }

  if (!session.url) {
    return { error: "Checkout session has no URL." };
  }

  redirect(session.url);
}
