"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const UPGRADED_LABELS: Record<string, string> = {
  pro: "Pro",
  premium: "Premium",
};

export function DashboardUpgradeNotice() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (upgraded && UPGRADED_LABELS[upgraded]) {
      setVisible(true);
    }
  }, [upgraded]);

  if (!visible || !upgraded) {
    return null;
  }

  const label = UPGRADED_LABELS[upgraded] ?? upgraded;

  return (
    <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
      <p>
        <span className="font-semibold">Welcome to {label}!</span> Your plan will
        update as soon as Stripe confirms the subscription.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 rounded-lg px-2 py-1 text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
