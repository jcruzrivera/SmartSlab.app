"use client";

import Link from "next/link";
import { useState } from "react";

import {
  formatPlanPrice,
  formatPlanPricePeriod,
} from "@/lib/billing/plan-prices";
import { PLAN_LIMITS } from "@/lib/plan/limits";
import {
  startCheckout,
  type BillingCycle,
  type BillingPlan,
} from "@/lib/billing/start-checkout";

function formatLimit(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "Unlimited";
}

type PricingPlansProps = {
  className?: string;
};

export function PricingPlans({ className }: PricingPlansProps) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: BillingPlan) {
    const key = `${plan}-${billing}`;
    setLoadingKey(key);
    setError(null);
    const result = await startCheckout(plan, billing);
    if (!result.ok) {
      setError(result.error);
      setLoadingKey(null);
    }
  }

  return (
    <section id="pricing" className={className}>
      <div className="text-center">
        <span className="inline-block rounded-full border border-brand/30 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-strong">
          Plans
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Grow your stone business
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
          Start free, then upgrade when you need more inventory, SmartFinder
          searches, or marketplace analytics.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              billing === "monthly"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              billing === "annual"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          description="List your first slabs and try SmartFinder."
          features={[
            `${formatLimit(PLAN_LIMITS.free.inventory)} slabs`,
            `${formatLimit(PLAN_LIMITS.free.smartfinderPerMonth)} SmartFinder searches / month`,
            "Marketplace listings & checkout",
          ]}
          cta={
            <Link
              href="/sign-up"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Get started free
            </Link>
          }
        />

        <PlanCard
          name="Pro"
          price={formatPlanPrice("pro", billing)}
          period={formatPlanPricePeriod(billing)}
          description="For growing yards and fabricators."
          highlighted
          features={[
            `${formatLimit(PLAN_LIMITS.pro.inventory)} slabs`,
            `${formatLimit(PLAN_LIMITS.pro.smartfinderPerMonth)} SmartFinder searches / month`,
            "Full SmartFinder result access",
            "CSV bulk import",
          ]}
          cta={
            <button
              type="button"
              disabled={loadingKey !== null}
              onClick={() => void handleCheckout("pro")}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {loadingKey === `pro-${billing}` ? "Redirecting…" : "Start Pro"}
            </button>
          }
        />

        <PlanCard
          name="Premium"
          price={formatPlanPrice("premium", billing)}
          period={formatPlanPricePeriod(billing)}
          description="Unlimited scale plus market insights."
          features={[
            "Unlimited slabs",
            "Unlimited SmartFinder searches",
            "Market Data analytics",
            "Priority support",
          ]}
          cta={
            <button
              type="button"
              disabled={loadingKey !== null}
              onClick={() => void handleCheckout("premium")}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {loadingKey === `premium-${billing}`
                ? "Redirecting…"
                : "Start Premium"}
            </button>
          }
        />
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? "border-brand bg-brand/5 shadow-lg shadow-brand/10 dark:border-brand/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-strong">
        {name}
      </p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className="text-sm text-slate-500">{period}</span>
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-strong" aria-hidden>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}
