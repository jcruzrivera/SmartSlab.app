"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  COMPARE_CHANGE_EVENT,
  readCompareIds,
  subscribeGuestStore,
  toggleGuestCompare,
} from "@/lib/marketplace/guest-storage";

export function CompareButton({ slabId }: { slabId: string }) {
  const ids = useSyncExternalStore(
    (onStoreChange) => subscribeGuestStore(COMPARE_CHANGE_EVENT, onStoreChange),
    readCompareIds,
    () => [],
  );

  const included = ids.includes(slabId);

  function toggle() {
    toggleGuestCompare(slabId);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
      >
        {included ? "In compare" : "Compare"}
      </button>
      {ids.length > 0 ? (
        <Link
          href="/compare"
          className="text-sm font-medium text-[#0d8fa8] hover:underline"
        >
          View compare ({ids.length})
        </Link>
      ) : null}
    </div>
  );
}
