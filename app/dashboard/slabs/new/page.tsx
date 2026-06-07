import Link from "next/link";

import { SlabForm } from "@/components/slab/slab-form";
import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

export default async function NewSlabPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">List a slab</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The database is not connected yet, so listings cannot be saved.
        </p>
      </main>
    );
  }

  const materials = await listMaterials();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        href="/dashboard/slabs"
        className="text-sm font-medium text-slate-500 transition hover:text-[#0d8fa8]"
      >
        ← Back to inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">List a slab</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Publish a slab or remnant to the SmartSlab marketplace.
      </p>

      <div className="mt-6">
        <SlabForm materials={materials.map((m) => ({ id: m.id, name: m.name }))} />
      </div>
    </main>
  );
}
