import Link from "next/link";

import { SmartSlabLogo } from "@/components/brand/smartslab-logo";
import { hasValidClerkConfig } from "@/lib/auth/config";

const categories = [
  { slug: "granite", name: "Granite" },
  { slug: "quartz", name: "Quartz" },
  { slug: "quartzite", name: "Quartzite" },
  { slug: "marble", name: "Marble" },
  { slug: "dolomite", name: "Dolomite" },
];

export function SiteFooter() {
  const clerkEnabled = hasValidClerkConfig();

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white/60 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/50 print:hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="SmartSlab">
            <SmartSlabLogo />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            The marketplace to buy and sell natural stone slabs and remnants.
          </p>
        </div>

        <FooterColumn title="Marketplace">
          <FooterLink href="/browse">Browse all</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
          <FooterLink href="/dashboard/slabs/new">Sell a slab</FooterLink>
          <FooterLink href="/dashboard">Dashboard</FooterLink>
          <FooterLink href="/developers">Developers</FooterLink>
        </FooterColumn>

        <FooterColumn title="Categories">
          {categories.map((category) => (
            <FooterLink
              key={category.slug}
              href={`/browse?material=${category.slug}`}
            >
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Account">
          {clerkEnabled ? (
            <>
              <FooterLink href="/sign-in">Sign in</FooterLink>
              <FooterLink href="/sign-up">Create account</FooterLink>
            </>
          ) : null}
          <FooterLink href="/account">My account</FooterLink>
          <FooterLink href="/account#favorites">Saved slabs</FooterLink>
          <FooterLink href="/compare">Compare slabs</FooterLink>
        </FooterColumn>

        <FooterColumn title="Legal">
          <FooterLink href="/legal/terms">Terms of Service</FooterLink>
          <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/legal/shipping">Shipping Policy</FooterLink>
          <FooterLink href="/legal/refunds">Refund Policy</FooterLink>
          <FooterLink href="/legal/safety">Safety &amp; Compliance</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row">
          <p>(c) {new Date().getFullYear()} SmartSlab. All rights reserved.</p>
          <p>Natural stone slabs &amp; remnants marketplace</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-slate-500 transition hover:text-brand-strong dark:text-slate-400"
      >
        {children}
      </Link>
    </li>
  );
}
