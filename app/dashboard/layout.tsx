import { Suspense } from "react";

import { DashboardUpgradeNotice } from "@/components/billing/dashboard-upgrade-notice";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isDbConfigured } from "@/lib/db/client";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { effectivePlanForUser } from "@/lib/plan/limits";
import { hasComplimentaryAccess } from "@/lib/plan/partners";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = isDbConfigured() ? await getOrCreateCurrentDbUser() : null;
  const complimentary = hasComplimentaryAccess(user?.clerkId);
  const displayPlan = user ? effectivePlanForUser(user) : undefined;
  // Align badge with enforcement: complimentary → active; otherwise keep
  // real subscription status (so past_due / canceled still surface).
  const displayStatus = complimentary ? "active" : user?.planStatus;

  return (
    <>
      <DashboardNav
        currentPlan={displayPlan}
        planStatus={displayStatus}
        complimentary={complimentary}
      />
      <Suspense fallback={null}>
        <DashboardUpgradeNotice />
      </Suspense>
      {children}
    </>
  );
}
