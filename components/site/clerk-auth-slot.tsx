"use client";

import Link from "next/link";
import {
  ClerkLoaded,
  ClerkLoading,
  SignOutButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

const linkClassName =
  "text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300";

const primaryButtonClassName =
  "inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]";

function GuestLinks() {
  return (
    <>
      <Link href="/sign-in" className={linkClassName}>
        Sign in
      </Link>
      <Link href="/sign-up" className={primaryButtonClassName}>
        Get started
      </Link>
    </>
  );
}

function SignedInLinks() {
  return (
    <>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-9 w-9",
          },
        }}
      />
      <SignOutButton redirectUrl="/browse">
        <button type="button" className={linkClassName}>
          Log out
        </button>
      </SignOutButton>
      <Link href="/dashboard" className={primaryButtonClassName}>
        Dashboard
      </Link>
    </>
  );
}

function AuthStateLinks() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <SignedInLinks />;
  }

  return <GuestLinks />;
}

export function ClerkAuthSlot() {
  return (
    <div className="flex items-center gap-3">
      <ClerkLoading>
        <GuestLinks />
      </ClerkLoading>
      <ClerkLoaded>
        <AuthStateLinks />
      </ClerkLoaded>
    </div>
  );
}
