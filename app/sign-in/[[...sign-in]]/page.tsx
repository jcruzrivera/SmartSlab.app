import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { resolveSafeRedirectUrl } from "@/lib/auth/safe-redirect";
import { hasValidClerkConfig } from "@/lib/auth/config";

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  const { redirect_url: redirectUrlParam } = await searchParams;
  const afterSignIn = resolveSafeRedirectUrl(redirectUrlParam);
  const { userId } = await auth();

  if (userId) {
    redirect(afterSignIn);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <SignIn
        fallbackRedirectUrl={afterSignIn}
        appearance={{
          variables: {
            colorPrimary: "#1bb0ce",
          },
        }}
      />
    </main>
  );
}
