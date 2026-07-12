import Link from "next/link";

import {
  InventoryTable,
  type InventoryRow,
} from "@/components/inventory/inventory-table";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
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

  const rows: InventoryRow[] = slabs.map((slab) => ({
    id: slab.id,
    name: slab.name,
    materialName: slab.material?.name ?? "—",
    dimensions: formatDimensions(
      slab.widthIn,
      slab.heightIn,
      slab.thicknessCm,
    ),
    price: formatPrice(slab.price),
    status: slab.status,
    hasShortCode: Boolean(slab.shortCode),
  }));

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
        <InventoryTable rows={rows} />
      )}
    </section>
  );
}
