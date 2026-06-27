"use client";

import Link from "next/link";

/** Static auth links — avoids Clerk hook hydration loops on public pages. */
export function ClerkAuthSlot() {
  return (
    <>
      <Link
        href="/sign-in"
        className="text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
      >
        Get started
      </Link>
    </>
  );
}
