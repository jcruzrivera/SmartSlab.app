import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { DuplicateButton } from "@/components/slab/duplicate-button";
import { Badge, slabStatusVariant } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { isDbConfigured } from "@/lib/db/client";
import { listSlabsByVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatDimensions, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/slabs/import"
            className={buttonClasses({ variant: "outline" })}
          >
            Bulk import CSV
          </Link>
          <Link
            href="/dashboard/slabs/new"
            className={buttonClasses()}
          >
            + List a slab
          </Link>
        </div>
      </div>

      {slabs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Publish your first slab to start receiving inquiries.
          </p>
          <Link
            href="/dashboard/slabs/new"
            className={buttonClasses({ className: "mt-5" })}
          >
            List a slab
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
                      className="font-medium hover:text-brand-strong"
                    >
                      {slab.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {slab.material?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDimensions(slab.widthIn, slab.heightIn, slab.thicknessCm)}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(slab.price)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={slabStatusVariant[slab.status] ?? "muted"}
                      className="capitalize"
                    >
                      {slab.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <DuplicateButton slabId={slab.id} />
                      <Link
                        href={`/dashboard/slabs/${slab.id}/edit`}
                        className="text-sm font-medium text-brand-strong hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  );
}
