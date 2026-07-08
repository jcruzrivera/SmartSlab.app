import Link from "next/link";

import { OnboardButton } from "@/components/connect/onboard-button";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import {
  getAccountStatus,
  isStripeConfigured,
  type AccountStatus,
} from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

/**
 * Onboarding screen for connected accounts.
 *
 * The onboarding status is read LIVE from the Stripe API every render (we do
 * not persist it in the database), per the V2 recommended pattern.
 */
export default async function ConnectOnboardingPage() {
  const stripeReady = isStripeConfigured();
  const user = stripeReady ? await getOrCreateCurrentDbUser() : null;
  const accountId = user?.stripeAccountId ?? null;

  let status: AccountStatus | null = null;
  let statusError: string | null = null;

  if (accountId) {
    try {
      status = await getAccountStatus(accountId);
    } catch (error) {
      statusError =
        error instanceof Error ? error.message : "Could not load account status.";
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/connect" className="text-sm text-brand-strong hover:underline">
        ← Connect sample
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Collect payments
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Onboard your account with Stripe so you can receive payouts.
      </p>

      {!stripeReady ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Stripe is not configured yet. Set <code>STRIPE_SECRET_KEY</code> in your
          environment to enable onboarding.
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Onboarding status</h2>

          {!accountId ? (
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              You haven&apos;t started onboarding yet.
            </p>
          ) : statusError ? (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {statusError}
            </p>
          ) : status ? (
            <dl className="mt-4 space-y-3">
              <StatusRow
                label="Ready to receive payments"
                ok={status.readyToReceivePayments}
              />
              <StatusRow
                label="Onboarding complete"
                ok={status.onboardingComplete}
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-slate-500">Requirements status</dt>
                <dd className="font-medium">
                  {status.requirementsStatus ?? "none"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-slate-500">Account ID</dt>
                <dd className="font-mono text-xs">{status.accountId}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-6">
            <OnboardButton
              label={
                accountId
                  ? status?.onboardingComplete
                    ? "Update onboarding details"
                    : "Continue onboarding"
                  : "Onboard to collect payments"
              }
            />
          </div>
        </div>
      )}
    </main>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            ok
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {ok ? "Yes" : "No"}
        </span>
      </dd>
    </div>
  );
}
