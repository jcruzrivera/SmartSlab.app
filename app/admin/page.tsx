import { redirect } from "next/navigation";
import Link from "next/link";

import {
  setListingStatusAction,
  setQuoteStatusAction,
  setVendorVerificationAction,
} from "@/app/admin/actions";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import {
  listAdminQuotes,
  listAdminSlabs,
  listAdminTransactions,
  listAdminUsers,
} from "@/lib/db/admin";
import { getCurrentDbUser } from "@/lib/db/users";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentDbUser();

  if (!user || user.role !== "admin") {
    redirect("/unauthorized");
  }

  const [users, slabs, quotes, transactions] = await Promise.all([
    listAdminUsers(),
    listAdminSlabs(),
    listAdminQuotes(),
    listAdminTransactions(),
  ]);

  const vendors = users.filter((entry) =>
    ["vendor", "both", "admin"].includes(entry.role),
  );
  const activeSlabs = slabs.filter((slab) => slab.status === "available");
  const openQuotes = quotes.filter((quote) =>
    ["new", "contacted", "quoted"].includes(quote.status),
  );
  const paidOrders = transactions.filter((tx) =>
    ["paid", "shipped", "delivered"].includes(tx.status),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin console</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Review vendors, listings, quote leads, and orders from one place.
          </p>
        </div>
        <Link
          href="/browse"
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
        >
          View marketplace
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Vendors" value={vendors.length.toString()} />
        <Metric label="Active listings" value={activeSlabs.length.toString()} />
        <Metric label="Open leads" value={openQuotes.length.toString()} />
        <Metric label="Paid orders" value={paidOrders.length.toString()} />
      </div>

      <section className="mt-8">
        <SectionHeader title="Listings" detail={`${slabs.length} recent`} />
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/slab/${slab.id}`} className="font-medium hover:text-[#0d8fa8]">
                      {slab.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {slab.material?.name ?? "Stone"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {slab.vendor?.companyName ??
                      slab.vendor?.contactName ??
                      slab.vendor?.email ??
                      "Vendor"}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(slab.price)}</td>
                  <td className="px-4 py-3">
                    <form action={setListingStatusAction} className="flex gap-2">
                      <input type="hidden" name="slabId" value={slab.id} />
                      <select
                        name="status"
                        defaultValue={slab.status}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                        <option value="hidden">Hidden</option>
                      </select>
                      <button
                        type="submit"
                        className="h-9 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-[#0d8fa8] dark:bg-slate-700"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/slabs/${slab.id}/edit`}
                      className="font-medium text-[#0d8fa8] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader title="Vendors" detail={`${vendors.length} accounts`} />
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {vendor.companyName ?? vendor.contactName ?? "Vendor"}
                      </p>
                      <p className="text-xs text-slate-500">{vendor.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <form action={setVendorVerificationAction} className="flex gap-2">
                        <input type="hidden" name="userId" value={vendor.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={vendor.isVerified ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
                        >
                          {vendor.isVerified ? "Verified" : "Mark verified"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SectionHeader title="Quote leads" detail={`${quotes.length} recent`} />
          <div className="mt-3 flex max-h-[480px] flex-col gap-3 overflow-y-auto">
            {quotes.map((quote) => (
              <article
                key={quote.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {quote.slab ? (
                        <Link href={`/slab/${quote.slab.id}`} className="hover:text-[#0d8fa8]">
                          {quote.slab.name}
                        </Link>
                      ) : (
                        "Removed listing"
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {quote.buyerName ?? quote.buyer?.companyName ?? "Buyer"} -
                      {" "}
                      {quote.buyerEmail}
                    </p>
                  </div>
                  <form action={setQuoteStatusAction} className="flex gap-2">
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <select
                      name="status"
                      defaultValue={quote.status}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-[#1bb0ce] px-3 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
                    >
                      Save
                    </button>
                  </form>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                  {quote.message}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Orders" detail={`${transactions.length} recent`} />
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Slab</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3">
                    {tx.slab ? (
                      <Link href={`/slab/${tx.slab.id}`} className="font-medium hover:text-[#0d8fa8]">
                        {tx.slab.name}
                      </Link>
                    ) : (
                      "Removed listing"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.buyer?.companyName ?? tx.buyer?.contactName ?? tx.buyer?.email}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.vendor?.companyName ?? tx.vendor?.email}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(tx.total)}</td>
                  <td className="px-4 py-3 capitalize">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
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

function SectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500">{detail}</p>
    </div>
  );
}
