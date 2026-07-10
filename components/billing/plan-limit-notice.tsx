"use client";

import Link from "next/link";
import { useState } from "react";

import {
  startCheckout,
  type BillingCycle,
  type BillingPlan,
} from "@/lib/billing/start-checkout";

type PlanLimitNoticeProps = {
  message: string;
  upgradeTo?: BillingPlan;
  billing?: BillingCycle;
};

function formatPlan(plan: BillingPlan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function PlanLimitNotice({
  message,
  upgradeTo,
  billing = "monthly",
}: PlanLimitNoticeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    if (!upgradeTo) return;
    setLoading(true);
    setError(null);
    const result = await startCheckout(upgradeTo, billing);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <p>{message}</p>
      {error ? (
        <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {upgradeTo ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={loading}
            className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? "Redirecting…" : `Upgrade to ${formatPlan(upgradeTo)}`}
          </button>
          <Link
            href="/how-it-works#pricing"
            className="text-sm font-medium text-brand-strong underline"
          >
            Compare plans
          </Link>
        </div>
      ) : null}
    </div>
  );
}
