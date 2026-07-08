import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { SlabCard } from "@/components/slab/slab-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listFavoritesByUser } from "@/lib/db/favorites";
import { listQuoteRequestsByBuyer } from "@/lib/db/quotes";
import { listPurchasesByBuyer } from "@/lib/db/transactions";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  shipped: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  delivered:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

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

export default async function AccountPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to manage your account.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My account" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sign in to manage your profile, favorites, and purchase history.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const purchases = await listPurchasesByBuyer(user.id);
  const favorites = await listFavoritesByUser(user.id);
  const quoteRequests = await listQuoteRequestsByBuyer(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My account" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Manage your profile and review your orders.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          {user?.email}
          {user?.role ? ` | ${user.role}` : ""}
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <ProfileForm
            initial={{
              companyName: user?.companyName,
              contactName: user?.contactName,
              phone: user?.phone,
              address: user?.address,
              city: user?.city,
              state: user?.state,
              zip: user?.zip,
              country: user?.country,
            }}
          />
        </div>
      </section>

      {/* SmartFinder CTA */}
      <section className="mt-10">
        <Link
          href="/account/smartfinder"
          className="group flex items-center gap-5 rounded-2xl border border-[#1bb0ce]/30 bg-gradient-to-r from-[#1bb0ce]/10 to-transparent p-6 transition hover:border-[#1bb0ce]/60 hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1bb0ce]/15 text-[#0d8fa8] transition group-hover:bg-[#1bb0ce]/25">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">SmartFinder</h2>
              <span className="rounded-full bg-[#1bb0ce]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d8fa8]">
                New
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Define your project pieces and find the perfect slab from our inventory.
            </p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="ml-auto flex-shrink-0 text-slate-400 transition group-hover:text-[#0d8fa8]"
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>

      <section id="purchases" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold">Purchase history</h2>
        {purchases.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300">
              You have not purchased any slabs yet.
            </p>
            <Link
              href="/browse"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
            >
              Browse slabs
            </Link>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Slab</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {purchase.slab ? (
                        <Link
                          href={`/slab/${purchase.slab.id}`}
                          className="font-medium hover:text-[#0d8fa8]"
                        >
                          {purchase.slab.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Removed listing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(purchase.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[purchase.status] ?? statusStyles.cancelled
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="favorites" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold">Saved slabs</h2>
        {favorites.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300">
              Save slabs to revisit them later.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {favorites
              .filter((favorite) => favorite.slab)
              .map((favorite) => (
                <SlabCard key={favorite.id} slab={favorite.slab!} />
              ))}
          </div>
        )}
      </section>

      <section id="quotes" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold">Quote requests</h2>
        {quoteRequests.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300">
              Quote requests you send to vendors will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Slab</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quoteRequests.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {quote.slab ? (
                        <Link
                          href={`/slab/${quote.slab.id}`}
                          className="font-medium hover:text-[#0d8fa8]"
                        >
                          {quote.slab.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Removed listing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {quote.vendor?.companyName ??
                        quote.vendor?.contactName ??
                        "Vendor"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
