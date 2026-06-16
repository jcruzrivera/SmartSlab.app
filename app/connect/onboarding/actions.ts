"use server";

import { redirect } from "next/navigation";

import { getOrCreateCurrentDbUser, setStripeAccountId } from "@/lib/db/users";
import {
  createConnectedAccount,
  createOnboardingLink,
  isStripeConfigured,
} from "@/lib/stripe-connect";
import { getOrigin } from "@/lib/url";

export type OnboardingState = { error?: string };

/**
 * Ensures the signed-in user has a V2 connected account, then sends them to a
 * Stripe-h.
 * osted onboarding flow via an Account Link.
 *
 * Account creation uses the V2 Core Accounts API. The platform is responsible
 * for pricing and fee collection (fees_collector / losses_collector =
 * 'application'), and the account is provisioned as a `recipient` so it can
 * receive transfers from destination charges.
 */
export async function startOnboarding(
  _prevState: OnboardingState,
  _formData: FormData,
): Promise<OnboardingState> {
  if (!isStripeConfigured()) {
    return {
      error:
        "Payments are not configured yet (missing STRIPE_SECRET_KEY). Add it to your environment and try again.",
    };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in to onboard." };
  }

  let accountId = user.stripeAccountId;

  // Create the connected account only if we don't already have one mapped to
  // this user. We reuse the existing `users.stripe_account_id` column as the
  // user -> account mapping (no schema change required).
  if (!accountId) {
    accountId = await createConnectedAccount({
      displayName: user.companyName ?? user.contactName ?? user.email,
      email: user.email,
      dbUserId: user.id,
    });
    // Persist the user -> account mapping.
    await setStripeAccountId(user.id, accountId);
  }

  const origin = await getOrigin();

  // Create a V2 Account Link for hosted onboarding of the `recipient`
  // configuration. After completing/leaving, Stripe redirects back to us.
  const url = await createOnboardingLink(accountId, {
    refreshUrl: `${origin}/connect/onboarding?refresh=1`,
    returnUrl: `${origin}/connect/onboarding?accountId=${accountId}`,
  });

  // Send the user to Stripe's hosted onboarding.
  redirect(url);
}
