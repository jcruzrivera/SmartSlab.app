import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { getClerkDomain, hasValidClerkConfig } from "@/lib/auth/config";
import { resolveSafeRedirectUrl } from "@/lib/auth/safe-redirect";
import { CANONICAL_APP_HOST, CANONICAL_APP_ORIGIN, normalizeAppHost } from "@/lib/app-origin";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/admin(.*)",
]);

const isSlabDetailRoute = createRouteMatcher(["/slab/(.*)"]);

const hasClerkConfig = hasValidClerkConfig();

const clerkDomain = getClerkDomain();

const withClerkMiddleware = hasClerkConfig
  ? clerkMiddleware(
      async (auth, req) => {
        const { userId } = await auth();

        // Onboarding auth is handled in app/onboarding/page.tsx to avoid
        // sign-in ↔ onboarding loops when the session cookie is still settling.
        if (
          !userId &&
          (isProtectedRoute(req) || isSlabDetailRoute(req))
        ) {
          const redirectTarget = `${req.nextUrl.pathname}${req.nextUrl.search}`;
          const signIn = new URL("/sign-in", CANONICAL_APP_ORIGIN);
          signIn.searchParams.set(
            "redirect_url",
            resolveSafeRedirectUrl(redirectTarget, redirectTarget),
          );
          return NextResponse.redirect(signIn);
        }

        return NextResponse.next();
      },
      {
        ...(clerkDomain ? { domain: clerkDomain } : {}),
      },
    )
  : null;

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host");
  const normalized = normalizeAppHost(host);

  if (!normalized || normalized === host?.split(":")[0]?.toLowerCase()) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_APP_HOST;
  return NextResponse.redirect(url, 308);
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) {
    return hostRedirect;
  }

  if (!withClerkMiddleware) {
    return NextResponse.next();
  }

  try {
    return withClerkMiddleware(request, event);
  } catch {
    // Fail open to avoid global outages while env/config is being finalized.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.smartslab.store" }],
    },
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
