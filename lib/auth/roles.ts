export const APP_ROLES = ["admin", "vendor", "buyer", "both"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_ROUTE_RULES = {
  admin: ["/admin"],
  vendor: ["/dashboard"],
  buyer: ["/account"],
} as const;

export const FALLBACK_ROUTES: Record<AppRole, string> = {
  admin: "/admin",
  vendor: "/dashboard",
  buyer: "/account",
  both: "/dashboard",
};

export function hasRolePermission(
  userRole: AppRole | undefined,
  requiredRole: "admin" | "vendor" | "buyer",
): boolean {
  if (!userRole) {
    return false;
  }

  if (userRole === "admin") {
    return true;
  }

  if (userRole === "both") {
    return requiredRole === "vendor" || requiredRole === "buyer";
  }

  return userRole === requiredRole;
}
