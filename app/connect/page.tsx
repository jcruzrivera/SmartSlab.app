import Link from "next/link";

import { isStripeConfigured } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

const steps: { href: string; title: string; description: string }[] = [
  {
    href: "/connect/onboarding",
    title: "1. Onboard to collect payments",
    description:
      "Create a V2 connected account and complete Stripe-hosted onboarding.",
  },
  {
    href: "/connect/products",
    title: "2. Create products",
    description:
      "Add platform-level products linked to your connected account.",
  },
  {
    href: "/connect/store",
    title: "3. Storefront",
    description:
      "Browse products from all sellers and pay via hosted checkout.",
  },
];

/**
 * Entry point for the Stripe Connect (V2) sample. This flow is isolated from
 * the production payment flow under /dashboard/payments.
 */
export default function ConnectHomePage() {
  const stripeReady = isStripeConfigured();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Stripe Connect sample
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        A minimal end-to-end Connect demo: onboarding, products, storefront, and
        destination-charge checkout.
      </p>

      {!stripeReady ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Stripe is not configured yet.</p>
          <p className="mt-1 text-sm">
            Set <code>STRIPE_SECRET_KEY</code> (and{" "}
            <code>STRIPE_CONNECT_WEBHOOK_SECRET</code> for webhooks) in your
            environment, then restart/redeploy.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
