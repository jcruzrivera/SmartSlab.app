import Stripe from "stripe";

/**
 * ---------------------------------------------------------------------------
 * Stripe Connect (V2) sample integration — shared client + helpers
 * ---------------------------------------------------------------------------
 *
 * This module powers an ISOLATED sample under /connect and /api/connect/*.
 * It intentionally does NOT touch the existing V1 Connect flow in
 * lib/stripe.ts / app/dashboard/payments. It demonstrates the modern V2 Core
 * Accounts API: creating connected accounts, onboarding via account links,
 * reading live onboarding status, and processing destination charges.
 *
 * Stripe API version: the SDK pins the latest preview version automatically,
 * so we never set `apiVersion` here.
 */

let cached: Stripe | null = null;

/**
 * Returns a singleton Stripe Client used for ALL Stripe requests in the sample.
 *
 * The secret key must be provided via the STRIPE_SECRET_KEY environment
 * variable. Get it from the Stripe Dashboard → Developers → API keys.
 *
 *   STRIPE_SECRET_KEY=sk_test_********************************
 *
 * Throws a helpful error if the key is missing so failures are obvious.
 */
export function getStripeClient(): Stripe {
  // PLACEHOLDER: set this in .env.local (local) and in Vercel (production).
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your environment " +
        "(.env.local locally, Vercel → Settings → Environment Variables in " +
        "production), then restart/redeploy. Find it in the Stripe Dashboard " +
        "under Developers → API keys.",
    );
  }

  if (!cached) {
    // Equivalent to `new Stripe('sk_***')`. We attach appInfo for attribution.
    cached = new Stripe(secretKey, { appInfo: { name: "SmartSlab Connect Sample" } });
  }

  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Application fee the platform keeps on each sale, as a percentage. Defaults to
 * 10%. Configure via PLATFORM_FEE_PERCENT.
 */
export function getApplicationFeePercent(): number {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 10;
}

/**
 * Computes the platform application fee (in the smallest currency unit, e.g.
 * cents) for a given charge amount.
 */
export function computeApplicationFee(amountInCents: number): number {
  return Math.round((amountInCents * getApplicationFeePercent()) / 100);
}

/**
 * Creates a V2 connected account configured as a `recipient` that can receive
 * transfers (destination charges). The platform owns pricing, fee collection
 * and losses. Returns the new account id.
 */
export async function createConnectedAccount(input: {
  displayName: string;
  email: string;
  dbUserId: string;
}): Promise<string> {
  const stripeClient = getStripeClient();

  const account = await stripeClient.v2.core.accounts.create({
    display_name: input.displayName,
    contact_email: input.email,
    identity: {
      country: "us",
    },
    // 'express' gives the connected account a Stripe-hosted Express dashboard.
    dashboard: "express",
    defaults: {
      responsibilities: {
        // The platform collects fees and owns losses.
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            // Required so the account can receive transfers (destination charges).
            stripe_transfers: {
              requested: true,
            },
          },
        },
      },
    },
    metadata: { dbUserId: input.dbUserId },
  });

  return account.id;
}

/**
 * Creates a V2 hosted onboarding Account Link for the `recipient` configuration.
 */
export async function createOnboardingLink(
  accountId: string,
  urls: { refreshUrl: string; returnUrl: string },
): Promise<string> {
  const stripeClient = getStripeClient();

  const accountLink = await stripeClient.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: urls.refreshUrl,
        return_url: urls.returnUrl,
      },
    },
  });

  return accountLink.url;
}

export type AccountStatus = {
  accountId: string;
  /** True when the account can receive transfers (stripe_transfers active). */
  readyToReceivePayments: boolean;
  /** True when there are no outstanding required pieces of information. */
  onboardingComplete: boolean;
  /** Raw requirements status, useful for debugging/UI. */
  requirementsStatus: string | null;
};

/**
 * Reads the LIVE onboarding status of a connected account directly from the
 * API (we deliberately do not cache this in a database). Follows the V2
 * recommended approach of inspecting the recipient configuration capability and
 * the requirements summary.
 */
export async function getAccountStatus(
  accountId: string,
): Promise<AccountStatus> {
  const stripeClient = getStripeClient();

  const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements"],
  });

  const readyToReceivePayments =
    account?.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers?.status === "active";

  const requirementsStatus =
    account.requirements?.summary?.minimum_deadline?.status ?? null;

  const onboardingComplete =
    requirementsStatus !== "currently_due" &&
    requirementsStatus !== "past_due";

  return {
    accountId,
    readyToReceivePayments,
    onboardingComplete,
    requirementsStatus,
  };
}
