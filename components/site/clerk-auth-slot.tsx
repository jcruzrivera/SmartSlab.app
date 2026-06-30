"use client";

import Link from "next/link";
import { Show, SignOutButton } from "@clerk/nextjs";

const linkClassName =
  "text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300";

const primaryButtonClassName =
  "inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]";

export function ClerkAuthSlot() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <Link href="/sign-in" className={linkClassName}>
          Sign in
        </Link>
        <Link href="/sign-up" className={primaryButtonClassName}>
          Get started
        </Link>
      </Show>
      <Show when="signed-in">
        <SignOutButton>
          <button type="button" className={linkClassName}>
            Log out
          </button>
        </SignOutButton>
        <Link href="/dashboard" className={primaryButtonClassName}>
          Dashboard
        </Link>
      </Show>
    </div>
  );
}
