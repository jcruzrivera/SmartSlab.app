"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  COMPARE_CHANGE_EVENT,
  readCompareIds,
  subscribeGuestStore,
  toggleGuestCompare,
} from "@/lib/marketplace/guest-storage";
import { toast } from "@/lib/notifications/toast-store";

export function CompareButton({ slabId }: { slabId: string }) {
  const ids = useSyncExternalStore(
    (onStoreChange) => subscribeGuestStore(COMPARE_CHANGE_EVENT, onStoreChange),
    readCompareIds,
    () => [],
  );

  const included = ids.includes(slabId);

  function toggle() {
    toggleGuestCompare(slabId);
    if (included) {
      toast.info("Removed from compare");
    } else {
      toast.success("Added to compare");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-brand hover:text-brand-strong dark:border-slate-700"
      >
        {included ? "In compare" : "Compare"}
      </button>
      {ids.length > 0 ? (
        <Link
          href="/compare"
          className="text-sm font-medium text-brand-strong hover:underline"
        >
          View compare ({ids.length})
        </Link>
      ) : null}
    </div>
  );
}
