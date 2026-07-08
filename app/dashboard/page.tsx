import Link from "next/link";

import { GettingStarted } from "@/components/dashboard/getting-started";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listSlabsByVendor } from "@/lib/db/slabs";
import { listSalesByVendor } from "@/lib/db/transactions";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildVendorInsights } from "@/lib/dashboard/insights";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const dbReady = isDbConfigured();
  const user = dbReady ? await getOrCreateCurrentDbUser() : null;
  const slabs = user ? await listSlabsByVendor(user.id) : [];
  const sales = user ? await listSalesByVendor(user.id) : [];

  const activeCount = slabs.filter((slab) => slab.status === "available").length;
  const soldCount = slabs.filter((slab) => slab.status === "sold").length;
  const inventoryValue = slabs
    .filter((slab) => slab.status === "available")
    .reduce((sum, slab) => sum + Number(slab.price ?? 0), 0);

  const insights = buildVendorInsights({ user, slabs, sales });
  const onboardingComplete = insights.onboarding.every((step) => step.complete);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {user?.companyName ?? user?.contactName ?? "Your vendor workspace"}
          </p>
        </div>
        <Link
          href="/dashboard/slabs/new"
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          + List a slab
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Active listings" value={activeCount.toString()} />
        <Metric label="Inventory value" value={formatPrice(inventoryValue)} />
        <Metric label="Sold" value={soldCount.toString()} />
      </div>

      {!onboardingComplete ? (
        <div className="mt-8">
          <GettingStarted steps={insights.onboarding} />
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <QuickLink
            href="/dashboard/slabs"
            title="Manage inventory"
            description="Update photos, pricing, and availability."
          />
          <QuickLink
            href="/dashboard/sales"
            title="View sales"
            description="Track orders and fulfillment status."
          />
          <QuickLink
            href="/dashboard/leads"
            title="Quote leads"
            description="Review buyer quote requests."
          />
          <QuickLink
            href="/dashboard/messages"
            title="Messages"
            description="Reply to buyers and vendors."
          />
        </div>
      )}
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

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:bg-brand/5 dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </Link>
  );
}
