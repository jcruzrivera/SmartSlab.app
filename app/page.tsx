import Link from "next/link";
import type { Metadata } from "next";

import { SlabCard } from "@/components/slab/slab-card";
import { buttonClasses } from "@/components/ui/button";
import { isDbConfigured } from "@/lib/db/client";
import { listPublicSlabs } from "@/lib/db/slabs";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "SmartSlab — Slab & Remnant Marketplace",
  description:
    "Buy and sell natural stone slabs and remnants. Granite, quartz, quartzite, marble and more.",
  path: "/",
});

const categories = [
  { slug: "granite", name: "Granite" },
  { slug: "quartz", name: "Quartz" },
  { slug: "quartzite", name: "Quartzite" },
  { slug: "marble", name: "Marble" },
  { slug: "dolomite", name: "Dolomite" },
];

export default async function Home() {
  const featured = isDbConfigured()
    ? await listPublicSlabs({ limit: 6 })
    : [];

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-slate-200/60 dark:border-slate-800/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 pb-8 pt-10 md:gap-6 md:py-16">
          <p className="inline-flex w-fit rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-strong">
            Slab & remnant marketplace
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Buy and sell natural stone slabs and remnants.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            SmartSlab connects fabricators, workshops, and showrooms. List your
            leftover inventory in minutes, or find the exact slab you need from
            verified vendors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/browse" className={buttonClasses({ size: "lg" })}>
              Browse inventory
            </Link>
            <Link
              href="/dashboard/slabs/new"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Sell a slab
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/browse?material=${category.slug}`}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand hover:text-brand-strong dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Mobile scroll hint so buyers notice the listings below the fold. */}
          <a
            href="#listings"
            aria-label="Scroll to latest listings"
            className="mx-auto mt-1 flex flex-col items-center gap-0.5 text-brand-strong md:hidden"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              See slabs
            </span>
            <svg
              className="animate-bounce"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </section>

      <section
        id="listings"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 pb-12 pt-6 md:py-12"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Latest listings
          </h2>
          <Link
            href="/browse"
            className="text-sm font-medium text-brand-strong hover:underline"
          >
            View all
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p className="text-lg font-medium">The marketplace is just starting</p>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Be the first vendor to publish a slab and reach buyers today.
            </p>
            <Link
              href="/dashboard/slabs/new"
              className={buttonClasses({ className: "mt-5" })}
            >
              List the first slab
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((slab) => (
                <SlabCard key={slab.id} slab={slab} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/browse"
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className: "px-6",
                })}
              >
                View all slabs
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
