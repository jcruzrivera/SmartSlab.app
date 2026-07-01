"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";

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
  const { user } = useUser();
  const { signOut } = useClerk();
  const accountLabel =
    user?.fullName?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <>
      <Link href="/account" className={linkClassName}>
        {accountLabel}
      </Link>
      <button
        type="button"
        className={linkClassName}
        onClick={() => signOut({ redirectUrl: "/browse" })}
      >
        Log out
      </button>
      <Link href="/dashboard" className={primaryButtonClassName}>
        Dashboard
      </Link>
    </>
  );
}

export function ClerkAuthSlot() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <GuestLinks />
      </SignedOut>
      <SignedIn>
        <SignedInLinks />
      </SignedIn>
    </div>
  );
}
