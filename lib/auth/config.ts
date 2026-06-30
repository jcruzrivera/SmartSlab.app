/** Server-only env name (preferred on Vercel). Falls back to legacy NEXT_PUBLIC_* for local dev. */
export function getClerkPublishableKey(): string {
  return (
    process.env.NEXT_CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    ""
  );
}

/**
 * Optional Clerk proxy override. Not enabled automatically — with custom DNS
 * (`clerk.smartslab.store`) Clerk loads from Clerk's subdomain once verified.
 * Set only when explicitly using same-origin proxy, e.g.
 * `NEXT_PUBLIC_CLERK_PROXY_URL=https://smartslab.store/__clerk`.
 */
export function getClerkProxyUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  return explicit ? explicit.replace(/\/$/, "") : undefined;
}

export function hasValidClerkConfig(): boolean {
  const publishableKey = getClerkPublishableKey();
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";

  return publishableKey.startsWith("pk_") && secretKey.startsWith("sk_");
}

/** True when Clerk production keys are configured (required on Vercel). */
export function isClerkProductionConfig(): boolean {
  const publishableKey = getClerkPublishableKey();
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";

  return publishableKey.startsWith("pk_live_") && secretKey.startsWith("sk_live_");
}
