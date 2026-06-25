import Link from "next/link";

import { EngagementMetrics } from "@/components/dashboard/engagement-metrics";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { MarketplacePerformance } from "@/components/dashboard/marketplace-performance";
import { VerificationBadge } from "@/components/dashboard/verification-badge";
import { WalletPreview } from "@/components/dashboard/wallet-preview";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {user?.companyName ?? user?.contactName ?? "Vendor overview"}
          </p>
        </div>
        <Link
          href="/dashboard/slabs/new"
          className="inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          + List a slab
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Active listings" value={activeCount.toString()} />
        <Metric label="Inventory value" value={formatPrice(inventoryValue)} />
        <Metric label="Sold" value={soldCount.toString()} />
      </div>

      <EngagementMetrics engagement={insights.engagement} />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/slabs"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">Manage inventory</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            View, publish, and update your slab listings.
          </p>
        </Link>
        <Link
          href="/dashboard/sales"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">Sales &amp; orders</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track orders and earnings from your listings.
          </p>
        </Link>
        <Link
          href="/dashboard/leads"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">Quote leads</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Review buyer quote requests and mark follow-up status.
          </p>
        </Link>
        <Link
          href="/dashboard/messages"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">Messages</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Reply to buyers and keep quote conversations organized.
          </p>
        </Link>
        <Link
          href="/account#purchases"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">My purchases</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            See the slabs you&apos;ve bought and unlock vendor contacts.
          </p>
        </Link>
        <Link
          href="/dashboard/payments"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">Payments &amp; payouts</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Connect Stripe to receive payments for your slabs.
          </p>
        </Link>
        <Link
          href="/browse"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1bb0ce] hover:bg-[#1bb0ce]/5 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-medium">View marketplace</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            See how buyers discover slabs across SmartSlab.
          </p>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <GettingStarted steps={insights.onboarding} />
        <VerificationBadge status={insights.verification} />
      </div>

      <div className="mt-8">
        <MarketplacePerformance performance={insights.performance} />
      </div>

      <div className="mt-8">
        <WalletPreview wallet={insights.wallet} />
      </div>
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
