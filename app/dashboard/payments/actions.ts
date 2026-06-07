"use server";

import { redirect } from "next/navigation";

import { getOrCreateCurrentDbUser, setStripeAccountId } from "@/lib/db/users";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrigin } from "@/lib/url";

export type ConnectState = { error?: string };

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

  const stripe = getStripe();
  let accountId = user.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
      metadata: { dbUserId: user.id },
    });
    accountId = account.id;
    await setStripeAccountId(user.id, accountId);
  }

  const origin = await getOrigin();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/payments?refresh=1`,
    return_url: `${origin}/dashboard/payments?connected=1`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
