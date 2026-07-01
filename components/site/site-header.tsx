import Link from "next/link";
import type { ReactNode } from "react";

import { MobileNav, type NavItem } from "@/components/site/mobile-nav";

const mobileNavItems: NavItem[] = [
  { href: "/browse", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/compare", label: "Compare" },
  { href: "/dashboard/slabs/new", label: "Sell a slab" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/slabs", label: "Inventory" },
  { href: "/dashboard/sales", label: "Sales" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/account", label: "Account" },
];

export function SiteHeader({ authSlot }: { authSlot?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <MobileNav items={mobileNavItems} />
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1bb0ce] text-sm font-bold text-white">
              S
            </span>
            <span className="text-base font-semibold tracking-tight">
              SmartSlab
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
          <Link
            href="/how-it-works"
            className="rounded-lg px-3 py-1.5 transition hover:bg-[#1bb0ce]/10 hover:text-[#0d8fa8]"
          >
            How it works
          </Link>
          <Link
            href="/browse"
            className="rounded-lg px-3 py-1.5 transition hover:bg-[#1bb0ce]/10 hover:text-[#0d8fa8]"
          >
            Browse
          </Link>
          <Link
            href="/dashboard/slabs/new"
            className="rounded-lg px-3 py-1.5 transition hover:bg-[#1bb0ce]/10 hover:text-[#0d8fa8]"
          >
            Sell
          </Link>
          <Link
            href="/compare"
            className="rounded-lg px-3 py-1.5 transition hover:bg-[#1bb0ce]/10 hover:text-[#0d8fa8]"
          >
            Compare
          </Link>
        </nav>

        <div className="flex items-center gap-3">{authSlot}</div>
      </div>
    </header>
  );
}
