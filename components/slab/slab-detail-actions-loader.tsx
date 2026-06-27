"use client";

import dynamic from "next/dynamic";

import type { SlabDetailActionsProps } from "@/components/slab/slab-detail-actions";

const SlabDetailActions = dynamic(
  () =>
    import("@/components/slab/slab-detail-actions").then(
      (mod) => mod.SlabDetailActions,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="h-11 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-11 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-11 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    ),
  },
);

export function SlabDetailActionsLoader(props: SlabDetailActionsProps) {
  return <SlabDetailActions {...props} />;
}
