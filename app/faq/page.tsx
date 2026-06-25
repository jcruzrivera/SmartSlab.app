import Link from "next/link";
import type { Metadata } from "next";

import { FaqAccordion } from "@/components/legal/faq-accordion";
import { LegalSidebar } from "@/components/legal/legal-sidebar";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/legal/faq";
import { buildLegalMetadata } from "@/lib/legal/metadata";

export const metadata: Metadata = buildLegalMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about buying and selling stone slabs on SmartSlab: payments, Stripe Connect, pickup, refunds, and listings.",
  path: "/faq",
});

const faqById = Object.fromEntries(FAQ_ITEMS.map((item) => [item.id, item]));

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Legal", href: "/legal" },
          { label: "FAQ" },
        ]}
      />

      <div className="mt-2 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalSidebar currentPath="/faq" />
        </aside>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Answers for buyers and independent sellers on SmartSlab — checkout,
            Stripe payouts, pickup coordination, and marketplace rules.
          </p>

          <div className="mt-8 flex flex-col gap-10">
            {FAQ_CATEGORIES.map((category) => {
              const items = category.ids
                .map((id) => faqById[id])
                .filter(Boolean);

              return (
                <section key={category.label}>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {category.label}
                  </h2>
                  <FaqAccordion items={items} className="mt-4" />
                </section>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="font-medium">Need the full policy text?</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Visit the{" "}
              <Link href="/legal" className="text-[#0d8fa8] hover:underline">
                Legal center
              </Link>{" "}
              for Terms, Privacy, Shipping, Refunds, and Safety &amp; Compliance.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
