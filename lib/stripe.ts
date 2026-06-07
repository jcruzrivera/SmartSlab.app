import Stripe from "stripe";

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!cached) {
    cached = new Stripe(secretKey, {
      appInfo: { name: "SmartSlab" },
    });
  }

  return cached;
}

export function getPlatformFeePercent(): number {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 10;
}

export type FeeBreakdown = {
  subtotal: number;
  platformFee: number;
  vendorPayout: number;
  total: number;
};

/**
 * Computes the marketplace fee split for a sale. The buyer pays the subtotal;
 * the platform keeps PLATFORM_FEE_PERCENT and the vendor receives the rest.
 */
export function computeFees(subtotal: number): FeeBreakdown {
  const platformFee = Math.round(subtotal * getPlatformFeePercent()) / 100;
  const vendorPayout = Math.round((subtotal - platformFee) * 100) / 100;

  return {
    subtotal,
    platformFee,
    vendorPayout,
    total: subtotal,
  };
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
