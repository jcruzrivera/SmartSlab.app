import Link from "next/link";
import type { ReactNode } from "react";

import { SmartSlabLogo } from "@/components/brand/smartslab-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MobileNav, type NavItem } from "@/components/site/mobile-nav";

const publicMobileNavItems: NavItem[] = [
  { href: "/browse", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/compare", label: "Compare" },
  { href: "/dashboard/slabs/new", label: "Sell a slab" },
];

const signedInMobileNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/slabs", label: "Inventory" },
  { href: "/dashboard/sales", label: "Sales" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/account", label: "Account" },
  { href: "/account/smartfinder", label: "SmartFinder" },
];

export function SiteHeader({
  authSlot,
  isSignedIn = false,
}: {
  authSlot?: ReactNode;
  isSignedIn?: boolean;
}) {
  const mobileNavItems = isSignedIn
    ? [...publicMobileNavItems, ...signedInMobileNavItems]
    : publicMobileNavItems;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/60 print:hidden">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <MobileNav items={mobileNavItems} />
          <Link href="/" className="flex items-center gap-2" aria-label="SmartSlab">
            <SmartSlabLogo />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
          <Link
            href="/how-it-works"
            className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-strong"
          >
            How it works
          </Link>
          <Link
            href="/browse"
            className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-strong"
          >
            Browse
          </Link>
          <Link
            href="/dashboard/slabs/new"
            className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-strong"
          >
            Sell
          </Link>
          <Link
            href="/compare"
            className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-strong"
          >
            Compare
          </Link>
          {isSignedIn ? (
            <Link
              href="/account/smartfinder"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-strong"
            >
              SmartFinder
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn ? <NotificationBell /> : null}
          {authSlot}
        </div>
      </div>
    </header>
  );
}
