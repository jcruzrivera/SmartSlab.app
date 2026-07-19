import Link from "next/link";
import { notFound } from "next/navigation";

import { StudioEditorLoader } from "@/components/studio/studio-editor-loader";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { getProjectForUser } from "@/lib/db/sfProjects";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { buildPageMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Layout Studio — Piece editor",
  description: "Draw and edit the countertop pieces for your project.",
  path: "/account/smartfinder/studio",
});

export default async function StudioEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

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
        <h1 className="text-3xl font-semibold tracking-tight">Layout Studio</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Sign in to open this project.
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

  const project = await getProjectForUser(projectId, user.id);
  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My account", href: "/account" },
          { label: "SmartFinder", href: "/account/smartfinder" },
          { label: "Layout Studio", href: "/account/smartfinder/studio" },
          { label: project.name },
        ]}
      />
      <div className="mt-4">
        <StudioEditorLoader
          projectId={project.id}
          projectName={project.name}
          initialPieces={project.pieces.map((piece) => ({
            id: piece.id,
            kind: piece.kind,
            label: piece.label,
            polygon: piece.polygon,
            cutouts: piece.cutouts,
            veinLocked: piece.veinLocked,
            sortOrder: piece.sortOrder,
          }))}
        />
      </div>
    </main>
  );
}
