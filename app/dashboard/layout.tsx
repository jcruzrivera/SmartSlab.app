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

  return (
    <>
      <DashboardNav
        currentPlan={complimentary && user ? effectivePlanForUser(user) : user?.plan}
        planStatus={complimentary ? "active" : user?.planStatus}
        complimentary={complimentary}
      />
      <Suspense fallback={null}>
        <DashboardUpgradeNotice />
      </Suspense>
      {children}
    </>
  );
}
