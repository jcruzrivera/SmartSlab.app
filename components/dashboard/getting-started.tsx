import Link from "next/link";

import type { OnboardingStep } from "@/lib/dashboard/insights";

const STEP_LINKS: Record<string, { href: string; cta: string }> = {
  listing: { href: "/dashboard/slabs/new", cta: "Create listing" },
  stripe: { href: "/dashboard/payments", cta: "Connect" },
  publish: { href: "/dashboard/slabs", cta: "Manage" },
  order: { href: "/dashboard/sales", cta: "View sales" },
};

/**
 * Seller onboarding checklist. Completion status is derived from real data
 * (listings, Stripe connection, orders); falls back to incomplete when data is
 * unavailable.
 */
export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const completed = steps.filter((step) => step.complete).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Getting started</h2>
        <span className="text-sm text-slate-500">
          {completed}/{steps.length} done
        </span>
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, index) => {
          const link = STEP_LINKS[step.id];
          return (
            <li
              key={step.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    step.complete
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}
                  aria-hidden
                >
                  {step.complete ? "✓" : index + 1}
                </span>
                <span
                  className={`text-sm ${
                    step.complete
                      ? "text-slate-400 line-through"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!step.complete && link ? (
                <Link
                  href={link.href}
                  className="shrink-0 text-sm font-medium text-brand-strong hover:underline"
                >
                  {link.cta}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
