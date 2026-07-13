import { collaboratorProActive, isPartnerClerkId } from "./partners";

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

const PLAN_RANK: Record<UserPlan, number> = { free: 0, pro: 1, premium: 2 };

/**
 * Effective plan for a specific user, applying complimentary access grants:
 * lifetime partners get `premium`; active collaborators get at least `pro`
 * (never downgrading a real paid plan). Falls back to the normal
 * subscription-derived plan otherwise.
 */
export function effectivePlanForUser(user: {
  clerkId?: string | null;
  plan: string;
  planStatus: string;
}): UserPlan {
  if (isPartnerClerkId(user.clerkId)) {
    return "premium";
  }

  const base = effectivePlan(user.plan, user.planStatus);

  if (collaboratorProActive(user.clerkId)) {
    return PLAN_RANK[base] >= PLAN_RANK.pro ? base : "pro";
  }

  return base;
}
