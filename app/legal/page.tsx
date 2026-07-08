import Link from "next/link";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { LegalSidebar } from "@/components/legal/legal-sidebar";
import { LEGAL_LAST_UPDATED, LEGAL_NAV } from "@/lib/legal/nav";
import { buildLegalMetadata } from "@/lib/legal/metadata";

export const metadata: Metadata = buildLegalMetadata({
  title: "Legal Center",
  description:
    "SmartSlab policies for buyers and sellers: terms, privacy, shipping, refunds, safety, and frequently asked questions.",
  path: "/legal",
});

export default function LegalCenterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Legal" }]} />

      <div className="mt-2 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalSidebar currentPath="/legal" />
        </aside>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Legal center</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Policies for the SmartSlab marketplace — independent sellers, Stripe
            Connect payments, and buyer–seller coordination after checkout.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last updated: {LEGAL_LAST_UPDATED}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:bg-brand/5 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
