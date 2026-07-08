"use client";

import dynamic from "next/dynamic";

const linkClassName =
  "text-sm font-medium text-slate-600 transition hover:text-brand-strong dark:text-slate-300";

const primaryButtonClassName =
  "inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-sm font-medium text-white transition hover:bg-brand-strong";

const ClerkAuthSlot = dynamic(
  () => import("./clerk-auth-slot").then((mod) => mod.ClerkAuthSlot),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3">
        <span className={`${linkClassName} opacity-60`}>Sign in</span>
        <span className={`${primaryButtonClassName} opacity-60`} aria-hidden>
          Get started
        </span>
      </div>
    ),
  },
);

export function ClerkAuthSlotLoader({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return <ClerkAuthSlot isSignedIn={isSignedIn} />;
}
