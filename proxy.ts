import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { hasRolePermission, type AppRole } from "@/lib/auth/roles";

const isVendorRoute = createRouteMatcher(["/dashboard(.*)"]);
const isBuyerRoute = createRouteMatcher(["/account(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function getRoleFromClaims(sessionClaims: unknown): AppRole | undefined {
  if (typeof sessionClaims !== "object" || !sessionClaims) {
    return undefined;
  }

  const claims = sessionClaims as {
    metadata?: { role?: AppRole };
    publicMetadata?: { role?: AppRole };
  };

  return claims.metadata?.role ?? claims.publicMetadata?.role;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const needsAuth =
    isVendorRoute(req) || isBuyerRoute(req) || isAdminRoute(req);

  if (!userId && needsAuth) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (!needsAuth) {
    return NextResponse.next();
  }

  const role = getRoleFromClaims(sessionClaims);

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
