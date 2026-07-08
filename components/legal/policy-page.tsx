import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { LegalSidebar } from "@/components/legal/legal-sidebar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal/nav";
import type { PolicyContent } from "@/lib/legal/types";

type PolicyPageProps = {
  content: PolicyContent;
  currentPath: string;
};

/**
 * Reusable layout for legal policy pages: breadcrumbs, sidebar navigation,
 * structured sections, and consistent SmartSlab typography.
 */
export function PolicyPage({ content, currentPath }: PolicyPageProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Legal", href: "/legal" },
          { label: content.title },
        ]}
      />

      <div className="mt-2 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalSidebar currentPath={currentPath} />
        </aside>

        <article className="min-w-0">
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <h1 className="text-3xl font-semibold tracking-tight">
              {content.title}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              {content.description}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </header>

          <div className="mt-8 flex flex-col gap-8">
            {content.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-lg font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <footer className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="font-medium">Questions?</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Review our{" "}
              <Link href="/faq" className="text-brand-strong hover:underline">
                FAQ
              </Link>{" "}
              or contact us through your SmartSlab account for order-related
              inquiries.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
