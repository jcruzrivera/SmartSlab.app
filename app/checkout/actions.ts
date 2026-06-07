"use server";

import { redirect } from "next/navigation";

import { isDbConfigured } from "@/lib/db/client";
import { getSlabById } from "@/lib/db/slabs";
import { createTransaction } from "@/lib/db/transactions";
import { getDbUserById, getOrCreateCurrentDbUser } from "@/lib/db/users";
import {
  computeFees,
  getStripe,
  isStripeConfigured,
  toCents,
} from "@/lib/stripe";
import { getOrigin } from "@/lib/url";

export type CheckoutState = { error?: string };

export async function startCheckout(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return { error: "Checkout is not available yet." };
  }

  const slabId = formData.get("slabId");

  if (typeof slabId !== "string" || slabId.length === 0) {
    return { error: "Missing slab reference." };
  }

  const buyer = await getOrCreateCurrentDbUser();

  if (!buyer) {
    redirect("/sign-in");
  }

  const slab = await getSlabById(slabId);

  if (!slab || slab.status !== "available") {
    return { error: "This slab is no longer available." };
  }

  if (slab.vendorId === buyer.id) {
    return { error: "You can't purchase your own listing." };
  }

  const vendor = await getDbUserById(slab.vendorId);

  if (!vendor?.stripeAccountId) {
    return { error: "This vendor hasn't enabled payments yet." };
  }

  const subtotal = Number(slab.price);

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { error: "This listing has an invalid price." };
  }

  const fees = computeFees(subtotal);

  const transactionId = await createTransaction({
    buyerId: buyer.id,
    vendorId: vendor.id,
    slabId: slab.id,
    subtotal: fees.subtotal,
    platformFee: fees.platformFee,
    vendorPayout: fees.vendorPayout,
    total: fees.total,
  });

  const origin = await getOrigin();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: toCents(fees.total),
          product_data: {
            name: slab.name,
            description: slab.material?.name ?? undefined,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: toCents(fees.platformFee),
      transfer_data: { destination: vendor.stripeAccountId },
      metadata: { transactionId, slabId: slab.id, buyerId: buyer.id },
    },
    metadata: { transactionId, slabId: slab.id, buyerId: buyer.id },
    success_url: `${origin}/slab/${slab.id}?paid=1`,
    cancel_url: `${origin}/slab/${slab.id}?canceled=1`,
  });

  if (!session.url) {
    return { error: "Could not start checkout. Please try again." };
  }

  redirect(session.url);
}
