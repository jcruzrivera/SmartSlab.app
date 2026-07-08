import Link from "next/link";

import type { WalletPreview as Wallet } from "@/lib/dashboard/insights";
import { formatPrice } from "@/lib/format";

const STRIPE_LABELS: Record<Wallet["stripeStatus"], string> = {
  not_connected: "Not connected",
  pending: "Pending verification",
  active: "Active",
};

const STRIPE_STYLES: Record<Wallet["stripeStatus"], string> = {
  not_connected:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

/**
 * Wallet preview widget. Balances are estimates derived from recorded sales —
 * they are not a live Stripe balance. The Stripe API integration is intentionally
 * left for a future iteration (service abstraction lives in lib/dashboard/insights).
 */
export function WalletPreview({ wallet }: { wallet: Wallet }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Wallet</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            STRIPE_STYLES[wallet.stripeStatus]
          }`}
        >
          Stripe: {STRIPE_LABELS[wallet.stripeStatus]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Available balance</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatPrice(wallet.availableBalance)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Pending balance</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatPrice(wallet.pendingBalance)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Estimated from recorded sales. Final payouts are settled by Stripe.
        </p>
        <Link
          href="/dashboard/payments"
          className="shrink-0 text-sm font-medium text-brand-strong hover:underline"
        >
          Payouts
        </Link>
      </div>
    </div>
  );
}
