import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { hasValidClerkConfig } from "@/lib/auth/config";
import { hasRolePermission, parseAppRole } from "@/lib/auth/roles";

const isVendorRoute = createRouteMatcher(["/dashboard(.*)"]);
const isBuyerRoute = createRouteMatcher(["/account(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const hasClerkConfig = hasValidClerkConfig();

export default clerkMiddleware(async (auth, req) => {
  if (!hasClerkConfig) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const needsAuth =
    isVendorRoute(req) ||
    isBuyerRoute(req) ||
    isAdminRoute(req) ||
    isOnboardingRoute(req);

  if (!userId && needsAuth) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (!userId) {
    return NextResponse.next();
  }

  const role = parseAppRole(
    (sessionClaims as { metadata?: { role?: string } })?.metadata?.role,
  );

  if (!role && !isOnboardingRoute(req) && !isApiRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isAdminRoute(req) && !hasRolePermission(role, "admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isVendorRoute(req) && !hasRolePermission(role, "vendor")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isBuyerRoute(req) && !hasRolePermission(role, "buyer")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
