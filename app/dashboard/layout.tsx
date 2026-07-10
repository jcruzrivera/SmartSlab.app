import { Suspense } from "react";

import { DashboardUpgradeNotice } from "@/components/billing/dashboard-upgrade-notice";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isDbConfigured } from "@/lib/db/client";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = isDbConfigured() ? await getOrCreateCurrentDbUser() : null;

  return (
    <>
      <DashboardNav
        currentPlan={user?.plan}
        planStatus={user?.planStatus}
      />
      <Suspense fallback={null}>
        <DashboardUpgradeNotice />
      </Suspense>
      {children}
    </>
  );
}
