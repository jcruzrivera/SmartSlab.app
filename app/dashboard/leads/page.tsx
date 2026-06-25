import Link from "next/link";

import { updateVendorQuoteStatusAction } from "@/app/actions/marketplace";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import {
  listQuoteRequestsByVendor,
  type QuoteRequestWithRelations,
} from "@/lib/db/quotes";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  new: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  contacted: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  quoted:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  closed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled:
    "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function formatDate(value: Date | string | null): string {
  if (!value) return "Not dated";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LeadsPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to receive quote requests.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();
  const quotes = user ? await listQuoteRequestsByVendor(user.id) : [];
  const openCount = quotes.filter((quote) =>
    ["new", "contacted", "quoted"].includes(quote.status),
  ).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Leads" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quote leads</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {openCount} active request{openCount === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard/sales"
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
        >
          View orders
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-lg font-medium">No quote requests yet</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Buyers can request quotes from each public slab page.
          </p>
          <Link
            href="/dashboard/slabs"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
          >
            Manage inventory
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {quotes.map((quote) => (
            <LeadCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </main>
  );
}

function LeadCard({ quote }: { quote: QuoteRequestWithRelations }) {
  const buyerName =
    quote.buyer?.companyName ??
    quote.buyer?.contactName ??
    quote.buyerName ??
    "Buyer";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              {quote.slab ? (
                <Link href={`/slab/${quote.slab.id}`} className="hover:text-[#0d8fa8]">
                  {quote.slab.name}
                </Link>
              ) : (
                "Removed listing"
              )}
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                statusStyles[quote.status] ?? statusStyles.new
              }`}
            >
              {quote.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(quote.createdAt)} from {buyerName}
          </p>
        </div>
        <form action={updateVendorQuoteStatusAction} className="flex gap-2">
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
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {quote.message}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a href={`mailto:${quote.buyerEmail}`} className="text-[#0d8fa8] hover:underline">
          {quote.buyerEmail}
        </a>
        {quote.buyerPhone ? <span>{quote.buyerPhone}</span> : null}
      </div>
    </article>
  );
}
