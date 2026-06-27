"use client";

import dynamic from "next/dynamic";

const ClerkAuthSlot = dynamic(
  () => import("./clerk-auth-slot").then((mod) => mod.ClerkAuthSlot),
  {
    ssr: false,
    loading: () => <span className="inline-block h-9 w-24" aria-hidden />,
  },
);

export function AuthSlotLoader() {
  return <ClerkAuthSlot />;
}
