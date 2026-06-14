/**
 * Dashboard insights service (isolated, read-only).
 *
 * This module aggregates data that is ALREADY available in the database
 * (slabs, sales, user profile) and exposes placeholder service methods for
 * metrics that are not tracked yet (marketplace views, saves, messages, CTR).
 *
 * It introduces NO new database schema, migrations, API endpoints, or Stripe
 * calls. Placeholder methods return safe defaults (0) and are isolated here so
 * a future analytics / Stripe integration can replace them without touching the
 * dashboard UI.
 */

import type { SaleWithRelations } from "@/lib/db/transactions";

export type StripeStatus = "not_connected" | "pending" | "active";

/** Minimal structural shapes so this service stays decoupled from row types. */
type SlabLike = { status: string };
type UserLike = {
  email?: string | null;
  phone?: string | null;
  stripeAccountId?: string | null;
  isVerified?: boolean | null;
} | null;

export type EngagementMetrics = {
  /** Placeholder — not tracked yet. */
  marketplaceViews: number;
  /** Placeholder — not tracked yet. */
  savedByBuyers: number;
  /** Placeholder — not tracked yet. */
  messagesReceived: number;
  /** Real — gross revenue from paid orders. */
  revenue: number;
};

export type OnboardingStep = {
  id: string;
  label: string;
  complete: boolean;
};

export type MarketplacePerformance = {
  /** Placeholder — not tracked yet. */
  totalListingViews: number;
  /** Placeholder — derived from views, 0 until analytics exist. */
  clickThroughRate: number;
  /** Real — number of paid orders. */
  ordersReceived: number;
  /** Placeholder — derived from views, 0 until analytics exist. */
  conversionRate: number;
};

export type WalletPreview = {
  /** Derived from recorded paid sales (estimate, not a live Stripe balance). */
  availableBalance: number;
  /** Derived from recorded pending orders. */
  pendingBalance: number;
  stripeStatus: StripeStatus;
};

export type VerificationStatus = {
  email: boolean;
  phone: boolean;
  stripe: boolean;
  completed: number;
  total: number;
  verified: boolean;
};

export type VendorInsights = {
  engagement: EngagementMetrics;
  onboarding: OnboardingStep[];
  performance: MarketplacePerformance;
  wallet: WalletPreview;
  verification: VerificationStatus;
};

const PAID_STATUSES = new Set(["paid", "shipped", "delivered"]);

/**
 * Placeholder analytics source. Returns zeros until a real tracking pipeline is
 * wired up. Kept as a function so it can later read from an analytics store.
 */
export function getPlaceholderTraffic(): {
  marketplaceViews: number;
  savedByBuyers: number;
  messagesReceived: number;
  totalListingViews: number;
} {
  return {
    marketplaceViews: 0,
    savedByBuyers: 0,
    messagesReceived: 0,
    totalListingViews: 0,
  };
}

function resolveStripeStatus(user: UserLike): StripeStatus {
  if (!user?.stripeAccountId) {
    return "not_connected";
  }
  return user.isVerified ? "active" : "pending";
}

export function buildVendorInsights(input: {
  user: UserLike;
  slabs: SlabLike[];
  sales: SaleWithRelations[];
}): VendorInsights {
  const { user, slabs, sales } = input;
  const traffic = getPlaceholderTraffic();

  const paidSales = sales.filter((sale) => PAID_STATUSES.has(sale.status));
  const pendingSales = sales.filter((sale) => sale.status === "pending");

  const revenue = paidSales.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0,
  );
  const netEarnings = paidSales.reduce(
    (sum, sale) => sum + Number(sale.vendorPayout ?? 0),
    0,
  );
  const pendingPayout = pendingSales.reduce(
    (sum, sale) => sum + Number(sale.vendorPayout ?? 0),
    0,
  );

  const ordersReceived = paidSales.length;
  const totalListingViews = traffic.totalListingViews;
  const conversionRate =
    totalListingViews > 0 ? (ordersReceived / totalListingViews) * 100 : 0;

  const hasListing = slabs.length > 0;
  const hasPublished = slabs.some((slab) => slab.status === "available");
  const hasStripe = Boolean(user?.stripeAccountId);
  const hasOrder = sales.length > 0;

  const emailVerified = Boolean(user?.email);
  const phoneVerified = Boolean(user?.phone);
  const stripeVerified = hasStripe && Boolean(user?.isVerified);
  const verificationChecks = [emailVerified, phoneVerified, stripeVerified];
  const completed = verificationChecks.filter(Boolean).length;

  return {
    engagement: {
      marketplaceViews: traffic.marketplaceViews,
      savedByBuyers: traffic.savedByBuyers,
      messagesReceived: traffic.messagesReceived,
      revenue,
    },
    onboarding: [
      { id: "listing", label: "Create your first listing", complete: hasListing },
      { id: "stripe", label: "Connect Stripe", complete: hasStripe },
      { id: "publish", label: "Publish inventory", complete: hasPublished },
      { id: "order", label: "Receive your first order", complete: hasOrder },
    ],
    performance: {
      totalListingViews,
      clickThroughRate: 0,
      ordersReceived,
      conversionRate,
    },
    wallet: {
      availableBalance: netEarnings,
      pendingBalance: pendingPayout,
      stripeStatus: resolveStripeStatus(user),
    },
    verification: {
      email: emailVerified,
      phone: phoneVerified,
      stripe: stripeVerified,
      completed,
      total: verificationChecks.length,
      verified: completed === verificationChecks.length,
    },
  };
}
