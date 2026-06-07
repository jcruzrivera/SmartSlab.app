import Link from "next/link";

import { SlabCard } from "@/components/slab/slab-card";
import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { listPublicSlabs } from "@/lib/db/slabs";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams: Promise<{ material?: string }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { material } = await searchParams;

  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Browse slabs</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The marketplace database is not connected yet. Add the
          <span className="mx-1 font-mono">DATABASE_URL</span>
          environment variable to start showing live inventory.
        </p>
      </main>
    );
  }

  const [materials, slabs] = await Promise.all([
    listMaterials(),
    listPublicSlabs({ materialSlug: material }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Browse slabs</h1>
        <p className="text-slate-600 dark:text-slate-300">
          {slabs.length} listing{slabs.length === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip label="All" href="/browse" active={!material} />
        {materials.map((item) => (
          <FilterChip
            key={item.id}
            label={item.name}
            href={`/browse?material=${item.slug}`}
            active={material === item.slug}
          />
        ))}
      </div>

      {slabs.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No slabs here yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Be the first to list inventory in this category.
          </p>
          <Link
            href="/dashboard/slabs/new"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            List a slab
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slabs.map((slab) => (
            <SlabCard key={slab.id} slab={slab} />
          ))}
        </div>
      )}
    </main>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-[#1bb0ce] bg-[#1bb0ce] text-white"
          : "border-slate-300 text-slate-600 hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700 dark:text-slate-300"
      }`}
    >
      {label}
    </Link>
  );
}
