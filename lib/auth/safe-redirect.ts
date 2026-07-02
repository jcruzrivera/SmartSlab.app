import { CANONICAL_APP_HOST, CANONICAL_APP_ORIGIN } from "@/lib/app-origin";

const DEFAULT_AFTER_AUTH = "/onboarding";

/** Only allow same-origin redirects to prevent open redirects. */
export function resolveSafeRedirectUrl(
  raw: string | null | undefined,
  fallback = DEFAULT_AFTER_AUTH,
): string {
  if (!raw?.trim()) {
    return fallback;
  }

  try {
    const url = new URL(raw, CANONICAL_APP_ORIGIN);
    if (url.host !== CANONICAL_APP_HOST) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    if (raw.startsWith("/") && !raw.startsWith("//")) {
      return raw;
    }
    return fallback;
  }
}

export function signInUrlWithRedirect(destination: string): string {
  const signIn = new URL("/sign-in", CANONICAL_APP_ORIGIN);
  signIn.searchParams.set(
    "redirect_url",
    new URL(destination, CANONICAL_APP_ORIGIN).toString(),
  );
  return `${signIn.pathname}${signIn.search}`;
}
