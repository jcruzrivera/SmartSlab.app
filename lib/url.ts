import { headers } from "next/headers";

import { CANONICAL_APP_ORIGIN } from "@/lib/app-origin";

/**
 * Resolves the current absolute origin for Stripe redirect URLs and webhooks.
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");

  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    CANONICAL_APP_ORIGIN
  ).replace(/\/$/, "");
}
