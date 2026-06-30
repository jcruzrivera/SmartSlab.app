import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { hasValidClerkConfig } from "@/lib/auth/config";

type SignUpPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (!hasValidClerkConfig()) {
    redirect("/");
  }

  const { redirect_url: redirectUrl } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <SignUp
        forceRedirectUrl={redirectUrl ?? "/onboarding"}
        appearance={{
          variables: {
            colorPrimary: "#1bb0ce",
          },
        }}
      />
    </main>
  );
}
