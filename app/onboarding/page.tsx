import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { RoleOnboardingForm } from "@/components/auth/role-onboarding-form";
import { hasValidClerkConfig } from "@/lib/auth/config";

export default async function OnboardingPage() {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <RoleOnboardingForm />
    </main>
  );
}
