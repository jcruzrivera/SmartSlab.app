import { CANONICAL_APP_HOST } from "@/lib/app-origin";

const CLERK_JS_VERSION = "6";
const CLERK_UI_VERSION = "1";

/** Server-only env name (preferred on Vercel). Falls back to legacy NEXT_PUBLIC_* for local dev. */
export function getClerkPublishableKey(): string {
  return (
    process.env.NEXT_CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    ""
  );
}

/**
 * Primary Clerk domain for production custom DNS.
 * Overrides legacy `clerk.smartslab.app` baked into older publishable keys.
 */
export function getClerkDomain(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim();
  if (fromEnv) {
    return fromEnv.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  if (!hasValidClerkConfig()) {
    return undefined;
  }

  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return CANONICAL_APP_HOST;
  }

  return undefined;
}

export function getClerkFrontendHost(): string | undefined {
  const domain = getClerkDomain();
  return domain ? `clerk.${domain}` : undefined;
}

/** Force Clerk browser bundles to load from verified custom DNS, not legacy .app hosts. */
export function getClerkScriptUrls():
  | { clerkJSUrl: string; clerkUIUrl: string }
  | undefined {
  const host = getClerkFrontendHost();
  if (!host) {
    return undefined;
  }

  return {
    clerkJSUrl: `https://${host}/npm/@clerk/clerk-js@${CLERK_JS_VERSION}/dist/clerk.browser.js`,
    clerkUIUrl: `https://${host}/npm/@clerk/ui@${CLERK_UI_VERSION}/dist/ui.browser.js`,
  };
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
