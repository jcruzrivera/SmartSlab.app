import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { hasValidClerkConfig } from "@/lib/auth/config";

export default function SignInPage() {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <SignIn
        forceRedirectUrl="/onboarding"
        appearance={{
          variables: {
            colorPrimary: "#1bb0ce",
          },
        }}
      />
    </main>
  );
}
