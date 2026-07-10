"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PlanLimitNotice } from "@/components/billing/plan-limit-notice";

export function DuplicateButton({ slabId }: { slabId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeTo, setUpgradeTo] = useState<"pro" | "premium" | undefined>();

  async function handleDuplicate() {
    setLoading(true);
    setError(null);
    setUpgradeTo(undefined);
    try {
      const res = await fetch(`/api/slabs/${slabId}/duplicate`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        id?: string;
        error?: string;
        upgradeTo?: "pro" | "premium";
      };
      if (res.ok && data.id) {
        router.push(`/dashboard/slabs/${data.id}/edit`);
        return;
      }
      setError(data.error ?? "Could not duplicate listing.");
      setUpgradeTo(data.upgradeTo);
      setLoading(false);
    } catch {
      setError("Could not duplicate listing.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="text-sm font-medium text-slate-500 transition hover:text-brand-strong disabled:opacity-60"
        title="Duplicate this listing"
      >
        {loading ? "Duplicating…" : "Duplicate"}
      </button>
      {error && upgradeTo ? (
        <div className="w-72">
          <PlanLimitNotice message={error} upgradeTo={upgradeTo} />
        </div>
      ) : error ? (
        <p className="max-w-xs text-right text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
