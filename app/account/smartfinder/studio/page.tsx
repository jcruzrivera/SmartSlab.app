import Link from "next/link";

import { StudioProjectList } from "@/components/studio/project-list";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listProjectsForUser } from "@/lib/db/sfProjects";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildPageMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Layout Studio — Design your countertop project",
  description:
    "Draw your countertop pieces, edit dimensions, and lay out your project before matching it against real slabs.",
  path: "/account/smartfinder/studio",
});

const BREADCRUMBS = [
  { label: "Home", href: "/" },
  { label: "My account", href: "/account" },
  { label: "SmartFinder", href: "/account/smartfinder" },
  { label: "Layout Studio" },
];

export default async function StudioProjectsPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Layout Studio</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Connect the database to use Layout Studio.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Breadcrumbs items={BREADCRUMBS} />
        <h1 className="text-3xl font-semibold tracking-tight">Layout Studio</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sign in to design countertop projects and match them against real
          slabs.
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

  const projects = await listProjectsForUser(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Breadcrumbs items={BREADCRUMBS} />
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Layout Studio</h1>
        <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
          Draw your countertop pieces with real dimensions, then match them
          against slabs and remnants.
        </p>
      </div>
      <StudioProjectList
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          pieceCount: p.pieceCount,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </main>
  );
}
