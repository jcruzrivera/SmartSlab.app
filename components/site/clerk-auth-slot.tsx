"use client";

import Link from "next/link";

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
      <Link href="/account" className={linkClassName}>
        Account
      </Link>
      <Link href="/dashboard" className={primaryButtonClassName}>
        Dashboard
      </Link>
    </>
  );
}

export function ClerkAuthSlot({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? <SignedInLinks /> : <GuestLinks />}
    </div>
  );
}
