/** Server-only env name (preferred on Vercel). Falls back to legacy NEXT_PUBLIC_* for local dev. */
export function getClerkPublishableKey(): string {
  return (
    process.env.NEXT_CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    ""
  );
}

/**
 * Same-origin Clerk proxy URL. Routes Frontend API traffic through `/__clerk`
 * instead of a custom `clerk.*` subdomain when DNS is not configured yet.
 */
export function getClerkProxyUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!appUrl) {
    return undefined;
  }

  return `${appUrl.replace(/\/$/, "")}/__clerk`;
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
