"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DuplicateButton({ slabId }: { slabId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/slabs/${slabId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/dashboard/slabs/${data.id}/edit`);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      className="text-sm font-medium text-slate-500 transition hover:text-brand-strong disabled:opacity-60"
      title="Duplicate this listing"
    >
      {loading ? "Duplicating…" : "Duplicate"}
    </button>
  );
}
