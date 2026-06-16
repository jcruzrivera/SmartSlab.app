"use server";

import { redirect } from "next/navigation";

import { getOrCreateCurrentDbUser, setStripeAccountId } from "@/lib/db/users";
import {
  createConnectedAccount,
  createOnboardingLink,
  isStripeConfigured,
} from "@/lib/stripe-connect";
import { getOrigin } from "@/lib/url";

export type ConnectState = { error?: string };

/**
 * Onboards (or re-onboards) the signed-in vendor to Stripe Connect using the
 * V2 Express flow:
 *   - One connected account per vendor (recipient + stripe_transfers).
 *   - Stripe-hosted onboarding (KYC/compliance handled by Stripe).
 *   - Each vendor gets their own Express dashboard.
 *
 * The user -> account mapping is stored in `users.stripe_account_id`, which is
 * the same destination used by checkout (destination charge with a 90/10 split
 * via the platform application fee).
 */
export async function startConnectOnboarding(
  _prevState: ConnectState,
  _formData: FormData,
): Promise<ConnectState> {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured yet (missing STRIPE_SECRET_KEY)." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  let accountId = user.stripeAccountId;

  if (!accountId) {
    accountId = await createConnectedAccount({
      displayName: user.companyName ?? user.contactName ?? user.email,
      email: user.email,
      dbUserId: user.id,
    });
    await setStripeAccountId(user.id, accountId);
  }

  const origin = await getOrigin();
  const url = await createOnboardingLink(accountId, {
    refreshUrl: `${origin}/dashboard/payments?refresh=1`,
    returnUrl: `${origin}/dashboard/payments?connected=1`,
  });

  redirect(url);
}
