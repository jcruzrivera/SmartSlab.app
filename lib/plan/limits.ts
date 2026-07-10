export const PLAN_LIMITS = {
  free: {
    inventory: 49,
    smartfinderPerMonth: 9,
    marketData: false,
  },
  pro: {
    inventory: 499,
    smartfinderPerMonth: 99,
    marketData: false,
  },
  premium: {
    inventory: Infinity,
    smartfinderPerMonth: Infinity,
    marketData: true,
  },
} as const;

export type UserPlan = keyof typeof PLAN_LIMITS;

export function isUserPlan(value: string): value is UserPlan {
  return value === "free" || value === "pro" || value === "premium";
}

export function effectivePlan(
  plan: string,
  planStatus: string,
): UserPlan {
  if (
    isUserPlan(plan) &&
    (planStatus === "active" || planStatus === "past_due") &&
    plan !== "free"
  ) {
    return plan;
  }
  return "free";
}
