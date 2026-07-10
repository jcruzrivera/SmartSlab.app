"use client";

export type BillingPlan = "pro" | "premium";
export type BillingCycle = "monthly" | "annual";

/**
 * Starts a Stripe subscription checkout session and redirects the browser.
 * Unauthenticated users are sent to sign-up.
 */
export async function startCheckout(
  plan: BillingPlan,
  billing: BillingCycle,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, billing }),
  });

  if (res.status === 401) {
    window.location.href = "/sign-up";
    return { ok: true };
  }

  const data = (await res.json()) as { url?: string; error?: string };

  if (!data.url) {
    return {
      ok: false,
      error: data.error ?? "Could not start checkout.",
    };
  }

  window.location.href = data.url;
  return { ok: true };
}
