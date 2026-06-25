import { CompareTable } from "@/components/slab/compare-table";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare" }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Compare slabs</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Review selected slabs side by side before contacting a vendor.
        </p>
      </div>
      <CompareTable />
    </main>
  );
}
