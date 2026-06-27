"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function ClerkAuthSlot() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]">
            Get started
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
