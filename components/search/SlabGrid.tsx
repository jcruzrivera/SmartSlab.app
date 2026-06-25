import Link from "next/link";

import { SlabCard } from "@/components/slab/slab-card";
import type { SlabWithRelations } from "@/lib/db/slabs";

export function SlabGrid({ slabs }: { slabs: SlabWithRelations[] }) {
  if (slabs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-lg font-medium">No slabs match these filters</p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Try removing a filter or widening your price range.
        </p>
        <Link
          href="/dashboard/slabs/new"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          List a slab
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {slabs.map((slab) => (
        <SlabCard key={slab.id} slab={slab} />
      ))}
    </div>
  );
}
