import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { slabs, users } from "@/lib/db/schema";
import type { DbUser } from "@/lib/db/users";
import {
  effectivePlan,
  PLAN_LIMITS,
  type UserPlan,
} from "@/lib/plan/limits";

export type PlanLimitPayload = {
  error: string;
  upgradeTo: "pro" | "premium";
};

export class PlanLimitError extends Error {
  readonly upgradeTo: "pro" | "premium";

  constructor(message: string, upgradeTo: "pro" | "premium") {
    super(message);
    this.name = "PlanLimitError";
    this.upgradeTo = upgradeTo;
  }

  toJSON(): PlanLimitPayload {
    return { error: this.message, upgradeTo: this.upgradeTo };
  }
}

function upgradeTarget(plan: UserPlan): "pro" | "premium" {
  return plan === "free" ? "pro" : "premium";
}

function planLabel(plan: UserPlan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** Counts every slab the vendor manages (all statuses, excluding soft-deleted). */
export async function countVendorManagedSlabs(vendorId: string): Promise<number> {
  if (!isDbConfigured()) {
    return 0;
  }

  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(slabs)
    .where(and(eq(slabs.vendorId, vendorId), isNull(slabs.deletedAt)));

  return row?.count ?? 0;
}

export async function assertInventoryCapacity(
  user: DbUser,
  additionalSlabs = 1,
): Promise<void> {
  const plan = effectivePlan(user.plan, user.planStatus);
  const cap = PLAN_LIMITS[plan].inventory;

  if (!Number.isFinite(cap)) {
    return;
  }

  const current = await countVendorManagedSlabs(user.id);
  if (current + additionalSlabs > cap) {
    const target = upgradeTarget(plan);
    throw new PlanLimitError(
      `You've reached your ${planLabel(plan)} plan limit of ${cap} slabs.`,
      target,
    );
  }
}

function startOfNextUtcMonth(from = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

async function refreshSmartfinderUsage(userId: string): Promise<{
  searchesUsed: number;
  resetAt: Date | null;
}> {
  const db = getDb();
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      smartfinderSearchesUsed: true,
      smartfinderResetAt: true,
    },
  });

  if (!row) {
    return { searchesUsed: 0, resetAt: null };
  }

  const now = new Date();
  const needsReset =
    !row.smartfinderResetAt || row.smartfinderResetAt.getTime() <= now.getTime();

  if (!needsReset) {
    return {
      searchesUsed: row.smartfinderSearchesUsed,
      resetAt: row.smartfinderResetAt,
    };
  }

  const resetAt = startOfNextUtcMonth(now);
  await db
    .update(users)
    .set({
      smartfinderSearchesUsed: 0,
      smartfinderResetAt: resetAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return { searchesUsed: 0, resetAt };
}

/** Checks the monthly SmartFinder quota and increments the counter on success. */
export async function consumeSmartfinderSearch(user: DbUser): Promise<void> {
  const plan = effectivePlan(user.plan, user.planStatus);
  const cap = PLAN_LIMITS[plan].smartfinderPerMonth;

  if (!Number.isFinite(cap)) {
    return;
  }

  const { searchesUsed } = await refreshSmartfinderUsage(user.id);

  if (searchesUsed >= cap) {
    throw new PlanLimitError(
      `You've reached your ${planLabel(plan)} plan limit of ${cap} SmartFinder searches this month.`,
      upgradeTarget(plan),
    );
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      smartfinderSearchesUsed: searchesUsed + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

export function assertMarketDataAccess(user: DbUser): void {
  const plan = effectivePlan(user.plan, user.planStatus);
  if (!PLAN_LIMITS[plan].marketData) {
    throw new PlanLimitError(
      "Market Data is available on the Premium plan.",
      "premium",
    );
  }
}

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return error instanceof PlanLimitError;
}
