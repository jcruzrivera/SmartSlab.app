import Link from "next/link";
import { redirect } from "next/navigation";

import { PlanLimitNotice } from "@/components/billing/plan-limit-notice";
import { MarketplacePerformance } from "@/components/dashboard/marketplace-performance";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listSlabsByVendor } from "@/lib/db/slabs";
import { listSalesByVendor } from "@/lib/db/transactions";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildVendorInsights } from "@/lib/dashboard/insights";
import { effectivePlan, PLAN_LIMITS } from "@/lib/plan/limits";

export const dynamic = "force-dynamic";

export default async function MarketDataPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Market Data</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to view marketplace analytics.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }

  const plan = effectivePlan(user.plan, user.planStatus);
  const hasAccess = PLAN_LIMITS[plan].marketData;

  if (!hasAccess) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Market Data" },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Market Data</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Track listing performance, conversion, and marketplace trends.
        </p>
        <div className="mt-6">
          <PlanLimitNotice
            message="Market Data is available on the Premium plan."
            upgradeTo="premium"
          />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/how-it-works#pricing" className="font-medium text-brand-strong underline">
            See what&apos;s included in Premium
          </Link>
        </p>
      </main>
    );
  }

  const slabs = await listSlabsByVendor(user.id);
  const sales = await listSalesByVendor(user.id);
  const insights = buildVendorInsights({ user, slabs, sales });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Market Data" },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Market Data</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            How your listings perform across the SmartSlab marketplace.
          </p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-strong">
          Premium
        </span>
      </div>

      <div className="mt-8">
        <MarketplacePerformance performance={insights.performance} />
      </div>
    </main>
  );
}
