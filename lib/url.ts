import { headers } from "next/headers";

export {
  CANONICAL_APP_HOST,
  CANONICAL_APP_ORIGIN,
  normalizeAppHost,
} from "@/lib/app-origin";

import { CANONICAL_APP_ORIGIN, normalizeAppHost } from "@/lib/app-origin";

/**
 * Public app URL for sitemaps, metadata, and env fallbacks.
 * Prefer `NEXT_PUBLIC_APP_URL`; default to the production domain outside dev.
 */
export function getConfiguredAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return CANONICAL_APP_ORIGIN;
}

/**
 * Resolves the current absolute origin from the incoming request, or falls back
 * to the configured app URL (e.g. Stripe redirect URLs).
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = normalizeAppHost(h.get("host"));

  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  return getConfiguredAppUrl();
}
