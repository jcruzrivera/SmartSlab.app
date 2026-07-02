import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { resolveSafeRedirectUrl } from "@/lib/auth/safe-redirect";
import { hasValidClerkConfig } from "@/lib/auth/config";

type SignUpPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  const { redirect_url: redirectUrlParam } = await searchParams;
  const afterSignUp = resolveSafeRedirectUrl(redirectUrlParam);
  const { userId } = await auth();

  if (userId) {
    redirect(afterSignUp);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <SignUp
        fallbackRedirectUrl={afterSignUp}
        appearance={{
          variables: {
            colorPrimary: "#1bb0ce",
          },
        }}
      />
    </main>
  );
}
