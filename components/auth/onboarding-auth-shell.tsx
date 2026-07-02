"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RoleOnboardingForm } from "@/components/auth/role-onboarding-form";
import { signInUrlWithRedirect } from "@/lib/auth/safe-redirect";

/**
 * Client-side auth gate so onboarding waits for Clerk to finish loading the
 * session before sending users to sign-in (avoids sign-in ↔ onboarding loops).
 */
export function OnboardingAuthShell() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(signInUrlWithRedirect("/onboarding"));
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <RoleOnboardingForm />;
}
