"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "smartslab.compare";
const COMPARE_CHANGE_EVENT = "smartslab-compare-change";
const MAX_COMPARE = 4;

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function notifyCompareChange(): void {
  window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
}

export function CompareButton({ slabId }: { slabId: string }) {
  // Start empty so the first client render matches SSR, then sync localStorage.
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readIds());

    function onStoreChange() {
      setIds(readIds());
    }

    window.addEventListener(COMPARE_CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(COMPARE_CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }, []);

  const included = ids.includes(slabId);

  function toggle() {
    const next = included
      ? ids.filter((id) => id !== slabId)
      : [slabId, ...ids.filter((id) => id !== slabId)].slice(0, MAX_COMPARE);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
    notifyCompareChange();
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
