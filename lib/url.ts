import { headers } from "next/headers";

/**
 * Resolves the current absolute origin (e.g. https://smart-slab-app.vercel.app
 * or http://localhost:3000) for building Stripe redirect URLs that work both in
 * local development and production.
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

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
