"use client";

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";

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

function SignedInLinks({ accountLabel }: { accountLabel: string }) {
  return (
    <>
      <Link href="/account" className={linkClassName}>
        {accountLabel}
      </Link>
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

export function ClerkAuthSlot() {
  const { isLoaded, user } = useUser();
  const accountLabel =
    user?.fullName?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <GuestLinks />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user ? <SignedInLinks accountLabel={accountLabel} /> : <GuestLinks />}
    </div>
  );
}
