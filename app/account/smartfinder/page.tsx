import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { SmartfinderFlow } from "@/components/smartfinder/smartfinder-flow";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { buildPageMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "SmartFinder — Find the perfect slab",
  description:
    "Define the stone pieces you need for your project and let SmartFinder match them against our inventory of available slabs and remnants.",
  path: "/account/smartfinder",
});

export default async function SmartFinderPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">SmartFinder</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to use SmartFinder.
        </p>
      </main>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "My account", href: "/account" },
            { label: "SmartFinder" },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">SmartFinder</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sign in to use SmartFinder and find the perfect slab for your project.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My account", href: "/account" },
          { label: "SmartFinder" },
        ]}
      />
      <div className="mb-8 text-center">
        <span className="inline-flex rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-strong">
          Premium tool
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          SmartFinder
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">
          Define the stone pieces you need for your project and we&apos;ll find
          the best matching slabs from our live inventory.
        </p>
      </div>
      <SmartfinderFlow />
    </main>
  );
}
