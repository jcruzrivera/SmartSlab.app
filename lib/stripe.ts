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

/**
 * ---------------------------------------------------------------------------
 * Stripe Connect — Express (classic) flow used by the live marketplace
 * ---------------------------------------------------------------------------
 *
 * This is the standard, battle-tested marketplace pattern: each vendor gets an
 * Express connected account with the `transfers` capability, Stripe hosts
 * onboarding/KYC, and buyer payments are taken as destination charges
 * (`transfer_data.destination` + `application_fee_amount`) on the classic
 * Checkout API. It integrates natively with `checkout.sessions.create`.
 */

/** Creates an Express connected account that can receive transfers. */
export async function createExpressAccount(input: {
  email: string;
}): Promise<string> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: input.email,
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account.id;
}

/** Creates a hosted Express onboarding link for the connected account. */
export async function createAccountOnboardingLink(
  accountId: string,
  urls: { refreshUrl: string; returnUrl: string },
): Promise<string> {
  const stripe = getStripe();

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: urls.refreshUrl,
    return_url: urls.returnUrl,
  });

  return link.url;
}

export type ExpressAccountStatus = {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  transfersActive: boolean;
  /** True when the account can receive destination-charge transfers. */
  readyToReceivePayments: boolean;
};

/** Reads live readiness of an Express connected account. */
export async function getExpressAccountStatus(
  accountId: string,
): Promise<ExpressAccountStatus> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  const transfersActive = account.capabilities?.transfers === "active";
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const chargesEnabled = Boolean(account.charges_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  return {
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    transfersActive,
    // For receiving destination charges, the transfers capability being active
    // is the requirement.
    readyToReceivePayments: transfersActive,
  };
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

/** Stripe API v22+: subscription id lives under invoice.parent, not invoice.subscription. */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) {
    return null;
  }
  return typeof subscription === "string" ? subscription : subscription.id;
}

/** Reads subscription period end from webhook payloads across Stripe SDK typings. */
export function getSubscriptionPeriodEnd(sub: Stripe.Subscription): number {
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (typeof legacy === "number") {
    return legacy;
  }

  const itemEnds = sub.items?.data
    ?.map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  return itemEnds?.length ? Math.max(...itemEnds) : 0;
}
