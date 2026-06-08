import Link from "next/link";

import { ProfileForm } from "@/components/account/profile-form";
import { isDbConfigured } from "@/lib/db/client";
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
    return "—";
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
  const purchases = user ? await listPurchasesByBuyer(user.id) : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Manage your profile and review your orders.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          {user?.email}
          {user?.role ? ` · ${user.role}` : ""}
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Purchase history</h2>
        {purchases.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300">
              You haven't purchased any slabs yet.
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
    </main>
  );
}
