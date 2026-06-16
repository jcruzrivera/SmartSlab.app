import { ConnectButton } from "@/components/payments/connect-button";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { getPlatformFeePercent } from "@/lib/stripe";
import { getAccountStatus, isStripeConfigured } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

type PayoutStatus = "not_started" | "pending" | "active";

/**
 * Reads the vendor's payout readiness LIVE from the Stripe V2 API (recipient
 * `stripe_transfers` capability + outstanding requirements).
 */
async function resolvePayoutStatus(
  stripeAccountId: string | null,
): Promise<PayoutStatus> {
  if (!stripeAccountId || !isStripeConfigured()) {
    return "not_started";
  }

  try {
    const status = await getAccountStatus(stripeAccountId);
    return status.readyToReceivePayments ? "active" : "pending";
  } catch {
    return "pending";
  }
}

const statusCopy: Record<PayoutStatus, { title: string; body: string; cta: string }> = {
  not_started: {
    title: "Set up payouts",
    body: "Connect a Stripe account to receive payments for your slabs. SmartSlab handles checkout and deposits your earnings automatically.",
    cta: "Connect with Stripe",
  },
  pending: {
    title: "Finish your Stripe setup",
    body: "Your Stripe account needs a few more details before you can receive payouts.",
    cta: "Continue setup",
  },
  active: {
    title: "Payouts active",
    body: "You're all set to receive payments. Earnings are deposited to your connected bank account.",
    cta: "Manage on Stripe",
  },
};

export default async function PaymentsPage() {
  const user = await getOrCreateCurrentDbUser();
  const status = await resolvePayoutStatus(user?.stripeAccountId ?? null);
  const copy = statusCopy[status];
  const feePercent = getPlatformFeePercent();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Receive payments from buyers through SmartSlab.
      </p>

      {!isStripeConfigured() ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Payments are not configured yet. Add your Stripe keys to enable
          checkout and payouts.
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                status === "active"
                  ? "bg-emerald-500"
                  : status === "pending"
                    ? "bg-amber-500"
                    : "bg-slate-300"
              }`}
            />
            <h2 className="text-lg font-semibold">{copy.title}</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {copy.body}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Platform fee: {feePercent}% per sale.
          </p>
          <div className="mt-4">
            <ConnectButton label={copy.cta} />
          </div>
        </div>
      )}
    </main>
  );
}
