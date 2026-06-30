import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { hasValidClerkConfig } from "@/lib/auth/config";
import { CANONICAL_APP_HOST, normalizeAppHost } from "@/lib/url";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/admin(.*)",
  "/onboarding(.*)",
]);

const isSlabDetailRoute = createRouteMatcher(["/slab/(.*)"]);

const hasClerkConfig = hasValidClerkConfig();

const withClerkMiddleware = hasClerkConfig
  ? clerkMiddleware(async (auth, req) => {
      const { userId } = await auth();

      // Only gate on authentication here. Fine-grained role enforcement is
      // handled in the server pages using the database, which avoids depending
      // on a customized Clerk session token (a common cause of redirect loops).
      if (
        !userId &&
        (isProtectedRoute(req) || isSlabDetailRoute(req))
      ) {
        const signIn = new URL("/sign-in", req.url);
        signIn.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signIn);
      }

      return NextResponse.next();
    })
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
