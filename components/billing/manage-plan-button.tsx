"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  startCheckout,
  type BillingCycle,
  type BillingPlan,
} from "@/lib/billing/start-checkout";

type Plan = BillingPlan;
type Billing = BillingCycle;

const CHECKOUT_OPTIONS: Array<{
  plan: Plan;
  billing: Billing;
  label: string;
  hint?: string;
}> = [
  { plan: "pro", billing: "monthly", label: "Pro", hint: "Monthly" },
  { plan: "pro", billing: "annual", label: "Pro", hint: "Annual" },
  { plan: "premium", billing: "monthly", label: "Premium", hint: "Monthly" },
  { plan: "premium", billing: "annual", label: "Premium", hint: "Annual" },
];

function planBadgeVariant(
  plan: string,
  status: string,
): "brand" | "success" | "warning" | "neutral" | "muted" {
  if (status === "past_due") return "warning";
  if (plan === "premium" && status === "active") return "brand";
  if (plan === "pro" && status === "active") return "success";
  if (plan === "free" || status === "none") return "muted";
  return "neutral";
}

function formatPlanLabel(plan: string): string {
  if (plan === "free") return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function ManagePlanButton({
  currentPlan,
  planStatus,
}: {
  currentPlan: string;
  planStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCheckout = useCallback(async (plan: Plan, billing: Billing) => {
    const key = `${plan}-${billing}`;
    setLoadingKey(key);
    setError(null);

    const result = await startCheckout(plan, billing);
    if (!result.ok) {
      setError(result.error);
      setLoadingKey(null);
    }
  }, []);

  const isBusy = loadingKey !== null;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={planBadgeVariant(currentPlan, planStatus)} className="capitalize">
          {formatPlanLabel(currentPlan)}
          {planStatus !== "none" && planStatus !== "active"
            ? ` · ${planStatus.replace("_", " ")}`
            : null}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {isBusy ? "Redirecting…" : "Manage plan"}
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
            Choose a plan
          </p>
          <ul className="p-1.5">
            {CHECKOUT_OPTIONS.map((option) => {
              const key = `${option.plan}-${option.billing}`;
              const isCurrent =
                currentPlan === option.plan && planStatus === "active";
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isBusy || isCurrent}
                    onClick={() => {
                      setOpen(false);
                      void handleCheckout(option.plan, option.billing);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {option.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isCurrent ? "Current" : option.hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
