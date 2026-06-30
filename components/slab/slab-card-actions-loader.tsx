"use client";

import dynamic from "next/dynamic";

const SlabCardActions = dynamic(
  () =>
    import("@/components/slab/slab-card-actions").then(
      (mod) => mod.SlabCardActions,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="inline-block h-8 w-14 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <span className="inline-block h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    ),
  },
);

export { SlabCardActions as SlabCardActionsLoader };
