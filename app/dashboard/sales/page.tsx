import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import {
  listSalesByVendor,
  summarizeSales,
  type SaleWithRelations,
} from "@/lib/db/transactions";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatPrice, formatPricePrecise } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  shipped: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  delivered:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  refunded: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  disputed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const PAID_STATUSES = ["paid", "shipped", "delivered"];

function formatDate(value: Date | string | null): string {
  if (!value) {
    return "N/A";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function SalesPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Sales</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to track your sales.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();
  const sales = user ? await listSalesByVendor(user.id) : [];
  const summary = summarizeSales(sales);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sales</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Track orders and earnings from your listings.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Net earnings" value={formatPrice(summary.netEarnings)} />
        <Metric label="Gross paid" value={formatPrice(summary.grossPaid)} />
        <Metric label="Paid orders" value={summary.paidCount.toString()} />
        <Metric label="Pending" value={summary.pendingCount.toString()} />
      </div>

      {sales.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No sales yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            When a buyer purchases one of your slabs, the order shows up here.
          </p>
          <Link
            href="/dashboard/slabs"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            Manage inventory
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Slab</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Your payout</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((sale) => (
                <SaleRow key={sale.id} sale={sale} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Net earnings are deposited to your connected Stripe account after the
        platform fee.
      </p>
    </main>
  );
}

function SaleRow({ sale }: { sale: SaleWithRelations }) {
  const isPaid = PAID_STATUSES.includes(sale.status);
  const buyerName =
    sale.buyer?.companyName ?? sale.buyer?.contactName ?? "Buyer";

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        {formatDate(sale.createdAt)}
      </td>
      <td className="px-4 py-3">
        {sale.slab ? (
          <Link
            href={`/slab/${sale.slab.id}`}
            className="font-medium hover:text-brand-strong"
          >
            {sale.slab.name}
          </Link>
        ) : (
          <span className="text-slate-400">Removed listing</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        {isPaid ? (
          <div className="flex flex-col">
            <span>{buyerName}</span>
            {sale.buyer?.email ? (
              <a
                href={`mailto:${sale.buyer.email}`}
                className="text-xs text-brand-strong hover:underline"
              >
                {sale.buyer.email}
              </a>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400">Awaiting payment</span>
        )}
      </td>
      <td className="px-4 py-3 font-medium">{formatPrice(sale.total)}</td>
      <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
        {formatPricePrecise(sale.vendorPayout)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            statusStyles[sale.status] ?? statusStyles.cancelled
          }`}
        >
          {sale.status}
        </span>
      </td>
    </tr>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
