"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe-connect";

export type ProductState = { error?: string; success?: boolean };

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(250),
  description: z.string().trim().max(500).optional(),
  // Price entered in dollars; converted to the smallest currency unit (cents).
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().trim().length(3).default("usd"),
});

/**
 * Creates a product at the PLATFORM level (not on the connected account).
 *
 * We store the product -> connected account mapping in product metadata
 * (`connectedAccountId`). This lets the storefront know which account should
 * receive the funds for each product, without any database schema change.
 */
export async function createProduct(
  _prevState: ProductState,
  formData: FormData,
): Promise<ProductState> {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (!user.stripeAccountId) {
    return {
      error: "Onboard your account first so products can be paid out to you.",
    };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    currency: (formData.get("currency") as string) || "usd",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product." };
  }

  const stripeClient = getStripeClient();

  try {
    await stripeClient.products.create({
      name: parsed.data.name,
      description: parsed.data.description,
      default_price_data: {
        // Convert dollars to cents.
        unit_amount: Math.round(parsed.data.price * 100),
        currency: parsed.data.currency.toLowerCase(),
      },
      // Product -> connected account mapping lives here.
      metadata: { connectedAccountId: user.stripeAccountId },
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create product.",
    };
  }

  revalidatePath("/connect/products");
  revalidatePath("/connect/store");
  return { success: true };
}
