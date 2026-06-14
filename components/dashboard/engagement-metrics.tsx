import { StatCard } from "@/components/dashboard/stat-card";
import type { EngagementMetrics as Engagement } from "@/lib/dashboard/insights";
import { formatPrice } from "@/lib/format";

/**
 * Phase 1 KPI row: marketplace engagement. Views / saves / messages are
 * placeholders (0) until tracking exists; revenue is real.
 */
export function EngagementMetrics({
  engagement,
}: {
  engagement: Engagement;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Marketplace views"
        value={engagement.marketplaceViews.toLocaleString("en-US")}
        hint="Coming soon"
      />
      <StatCard
        label="Saved by buyers"
        value={engagement.savedByBuyers.toLocaleString("en-US")}
        hint="Coming soon"
      />
      <StatCard
        label="Messages received"
        value={engagement.messagesReceived.toLocaleString("en-US")}
        hint="Coming soon"
      />
      <StatCard label="Revenue" value={formatPrice(engagement.revenue)} />
    </div>
  );
}
