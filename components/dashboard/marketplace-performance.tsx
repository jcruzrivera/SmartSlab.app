import { StatCard } from "@/components/dashboard/stat-card";
import type { MarketplacePerformance as Performance } from "@/lib/dashboard/insights";

/**
 * Marketplace performance stats. Structured for future analytics integration
 * (no charts yet). Views/CTR/conversion are placeholders until tracking exists.
 */
export function MarketplacePerformance({
  performance,
}: {
  performance: Performance;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Marketplace performance</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total listing views"
          value={performance.totalListingViews.toLocaleString("en-US")}
          hint="Coming soon"
        />
        <StatCard
          label="Click through rate"
          value={`${performance.clickThroughRate.toFixed(1)}%`}
          hint="Coming soon"
        />
        <StatCard
          label="Orders received"
          value={performance.ordersReceived.toLocaleString("en-US")}
        />
        <StatCard
          label="Conversion rate"
          value={`${performance.conversionRate.toFixed(1)}%`}
          hint="Coming soon"
        />
      </div>
    </section>
  );
}
