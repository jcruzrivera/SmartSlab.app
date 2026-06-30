"use client";

import Link from "next/link";
import { Show, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

const linkClassName =
  "text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300";

const primaryButtonClassName =
  "inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]";

export function ClerkAuthSlot() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button type="button" className={linkClassName}>
              Sign in
            </button>
          </SignInButton>
          <Link href="/sign-up" className={primaryButtonClassName}>
            Get started
          </Link>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
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
        </div>
      </Show>
    </div>
  );
}
