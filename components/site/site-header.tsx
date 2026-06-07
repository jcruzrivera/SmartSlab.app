import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({ authSlot }: { authSlot?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1bb0ce] text-sm font-bold text-white">
            S
          </span>
          <span className="text-base font-semibold tracking-tight">
            SmartSlab
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
          <Link href="/browse" className="transition hover:text-[#0d8fa8]">
            Browse
          </Link>
          <Link href="/dashboard/slabs/new" className="transition hover:text-[#0d8fa8]">
            Sell a slab
          </Link>
          <Link href="/dashboard" className="transition hover:text-[#0d8fa8]">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">{authSlot}</div>
      </div>
    </header>
  );
}
