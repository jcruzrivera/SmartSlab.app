import { redirect } from "next/navigation";

import { RoleOnboardingForm } from "@/components/auth/role-onboarding-form";
import { hasValidClerkConfig } from "@/lib/auth/config";
import { FALLBACK_ROUTES } from "@/lib/auth/roles";
import { signInUrlWithRedirect } from "@/lib/auth/safe-redirect";
import { getClerkUserId } from "@/lib/auth/session";
import { getCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  const userId = await getClerkUserId();

  if (!userId) {
    redirect(signInUrlWithRedirect("/onboarding"));
  }

  const existing = await getCurrentDbUser();
  if (existing?.role) {
    redirect(FALLBACK_ROUTES[existing.role]);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <RoleOnboardingForm />
    </main>
  );
}
