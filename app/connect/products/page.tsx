import Link from "next/link";
import type Stripe from "stripe";

import { ProductForm } from "@/components/connect/product-form";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
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

export default async function ConnectProductsPage() {
  const stripeReady = isStripeConfigured();
  const user = stripeReady ? await getOrCreateCurrentDbUser() : null;
  const accountId = user?.stripeAccountId ?? null;

  let myProducts: Stripe.Product[] = [];

  if (stripeReady && accountId) {
    const stripeClient = getStripeClient();
    const all = await stripeClient.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });
    // Keep only products mapped to this seller's connected account.
    myProducts = all.data.filter(
      (product) => product.metadata?.connectedAccountId === accountId,
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/connect" className="text-sm text-[#0d8fa8] hover:underline">
        ← Connect sample
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your products</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Create products that customers can buy in the storefront. Sales are paid
        out to your connected account.
      </p>

      {!stripeReady ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Set <code>STRIPE_SECRET_KEY</code> to manage products.
        </div>
      ) : !accountId ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-300">
            Onboard your account first so products can be paid out to you.
          </p>
          <Link
            href="/connect/onboarding"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            Go to onboarding
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <ProductForm />
          </div>

          <h2 className="mt-8 text-lg font-semibold">Existing products</h2>
          {myProducts.length === 0 ? (
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              No products yet. Create your first one above.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {myProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.description ? (
                      <p className="text-sm text-slate-500">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-semibold">
                    {formatAmount(product.default_price as Stripe.Price | null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
