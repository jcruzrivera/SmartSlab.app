import Link from "next/link";

import { getStripeClient, isStripeConfigured } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

export default async function ConnectSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let paid = false;
  let amountText: string | null = null;

  if (isStripeConfigured() && sessionId) {
    try {
      const stripeClient = getStripeClient();
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
      if (session.amount_total != null) {
        amountText = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: (session.currency ?? "usd").toUpperCase(),
        }).format(session.amount_total / 100);
      }
    } catch {
      // Ignore — we still show a generic confirmation below.
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {paid ? "Payment successful" : "Thank you"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {paid
            ? `Your payment${amountText ? ` of ${amountText}` : ""} was processed successfully.`
            : "Your order is being processed."}
        </p>
        <Link
          href="/connect/store"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Back to storefront
        </Link>
      </div>
    </main>
  );
}
