import Link from "next/link";
import type Stripe from "stripe";

import { BuyButton } from "@/components/connect/buy-button";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

function formatAmount(price: Stripe.Price | null | undefined): string {
  if (!price || price.unit_amount == null) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (price.currency ?? "usd").toUpperCase(),
  }).format(price.unit_amount / 100);
}

/**
 * Public storefront. Lists ALL products from ALL connected accounts and lets a
 * customer buy any of them via hosted checkout (destination charge).
 */
export default async function ConnectStorePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  const stripeReady = isStripeConfigured();

  let products: Stripe.Product[] = [];

  if (stripeReady) {
    const stripeClient = getStripeClient();
    const all = await stripeClient.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });
    // Only products linked to a connected account are sellable here.
    products = all.data.filter(
      (product) => Boolean(product.metadata?.connectedAccountId),
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/connect" className="text-sm text-brand-strong hover:underline">
        ← Connect sample
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Storefront</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Products from all connected sellers. Pay securely with Stripe Checkout.
      </p>

      {canceled ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Checkout canceled. You can try again any time.
        </div>
      ) : null}

      {!stripeReady ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Set <code>STRIPE_SECRET_KEY</code> to load the storefront.
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No products yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Connected sellers can add products from the Products page.
          </p>
          <Link
            href="/connect/products"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            Add a product
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const price = product.default_price as Stripe.Price | null;
            return (
              <div
                key={product.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="font-medium">{product.name}</p>
                {product.description ? (
                  <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                    {product.description}
                  </p>
                ) : null}
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {formatAmount(price)}
                </p>
                <div className="mt-4">
                  <BuyButton productId={product.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
