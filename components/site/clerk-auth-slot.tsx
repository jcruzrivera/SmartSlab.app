"use client";

import Link from "next/link";

import { UserMenu } from "@/components/site/user-menu";

const linkClassName =
  "text-sm font-medium text-slate-600 transition hover:text-brand-strong dark:text-slate-300";

const primaryButtonClassName =
  "inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-sm font-medium text-white transition hover:bg-brand-strong";

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
      <Link href="/dashboard" className={`${primaryButtonClassName} hidden sm:inline-flex`}>
        Dashboard
      </Link>
      <UserMenu />
    </>
  );
}

export function ClerkAuthSlot({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isSignedIn ? <SignedInLinks /> : <GuestLinks />}
    </div>
  );
}
