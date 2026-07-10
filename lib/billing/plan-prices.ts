import type { BillingPlan } from "@/lib/billing/start-checkout";

/** Display-only subscription prices shown across the app (Stripe charges via price IDs). */
export const PLAN_DISPLAY_PRICES: Record<
  BillingPlan,
  { monthly: number; annualMonthly: number }
> = {
  pro: { monthly: 49, annualMonthly: 39 },
  premium: { monthly: 149, annualMonthly: 119 },
};

export function formatPlanPrice(
  plan: BillingPlan,
  billing: "monthly" | "annual",
): string {
  const prices = PLAN_DISPLAY_PRICES[plan];
  const amount = billing === "annual" ? prices.annualMonthly : prices.monthly;
  return `$${amount}`;
}

export function formatPlanPricePeriod(
  billing: "monthly" | "annual",
): string {
  return billing === "annual" ? "/ mo, Billed annually" : "/ month";
}

/** Compact label for menus, e.g. "$49/month" or "$39/mo, billed annually". */
export function formatPlanPriceLabel(
  plan: BillingPlan,
  billing: "monthly" | "annual",
): string {
  const amount = formatPlanPrice(plan, billing);
  return billing === "annual"
    ? `${amount}/mo, billed annually`
    : `${amount}/month`;
}
