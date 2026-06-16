import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listSlabsByVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatDimensions, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  available:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  reserved:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  sold: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  hidden: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default async function DashboardSlabsPage() {
  if (!isDbConfigured()) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to manage your inventory.
        </p>
      </section>
    );
  }

  const user = await getOrCreateCurrentDbUser();
  const slabs = user ? await listSlabsByVendor(user.id) : [];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {slabs.length} listing{slabs.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard/slabs/new"
          className="inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          + List a slab
        </Link>
      </div>

      {slabs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Publish your first slab to start receiving inquiries.
          </p>
          <Link
            href="/dashboard/slabs/new"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            List a slab
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Dimensions</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/slab/${slab.id}`}
                      className="font-medium hover:text-[#0d8fa8]"
                    >
                      {slab.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {slab.material?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDimensions(slab.widthCm, slab.heightCm, slab.thicknessCm)}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(slab.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusStyles[slab.status] ?? statusStyles.hidden
                      }`}
                    >
                      {slab.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/slabs/${slab.id}/edit`}
                      className="text-sm font-medium text-[#0d8fa8] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
