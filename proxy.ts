import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { hasValidClerkConfig } from "@/lib/auth/config";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/admin(.*)",
  "/onboarding(.*)",
]);

const hasClerkConfig = hasValidClerkConfig();

const withClerkMiddleware = hasClerkConfig
  ? clerkMiddleware(async (auth, req) => {
      const { userId, redirectToSignIn } = await auth();

      // Only gate on authentication here. Fine-grained role enforcement is
      // handled in the server pages using the database, which avoids depending
      // on a customized Clerk session token (a common cause of redirect loops).
      if (!userId && isProtectedRoute(req)) {
        return redirectToSignIn({ returnBackUrl: req.url });
      }

      return NextResponse.next();
    })
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
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
    "/__clerk/(.*)",
  ],
};
