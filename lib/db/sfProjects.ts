import { and, asc, desc, eq, notInArray, sql } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { sfPieces, sfProjects } from "@/lib/db/schema";
import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";

export type SfProjectRow = typeof sfProjects.$inferSelect;
export type SfPieceRow = typeof sfPieces.$inferSelect;

export type SfProjectWithPieces = SfProjectRow & { pieces: SfPieceRow[] };

export type SavePiecePayload = {
  id: string;
  kind: "countertop" | "backsplash" | "island" | "other";
  label: string;
  /** World coordinates, inches (position baked in — see studio D1). */
  polygon: SfPolygon;
  cutouts: SfCutout[];
  veinLocked: boolean;
  sortOrder: number;
};

export async function listProjectsForUser(
  userId: string,
): Promise<Array<SfProjectRow & { pieceCount: number }>> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query.sfProjects.findMany({
    where: eq(sfProjects.userId, userId),
    orderBy: desc(sfProjects.updatedAt),
    with: {
      pieces: { columns: { id: true } },
    },
  });

  return rows.map(({ pieces, ...project }) => ({
    ...project,
    pieceCount: pieces.length,
  }));
}

export async function getProjectForUser(
  projectId: string,
  userId: string,
): Promise<SfProjectWithPieces | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const row = await db.query.sfProjects.findFirst({
    where: and(eq(sfProjects.id, projectId), eq(sfProjects.userId, userId)),
    with: {
      pieces: { orderBy: asc(sfPieces.sortOrder) },
    },
  });

  return row ?? null;
}

export async function createProject(
  userId: string,
  name: string,
): Promise<SfProjectRow | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .insert(sfProjects)
    .values({ userId, name })
    .returning();

  return row ?? null;
}

export async function renameProject(
  projectId: string,
  userId: string,
  name: string,
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const rows = await db
    .update(sfProjects)
    .set({ name })
    .where(and(eq(sfProjects.id, projectId), eq(sfProjects.userId, userId)))
    .returning({ id: sfProjects.id });

  return rows.length > 0;
}

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const rows = await db
    .delete(sfProjects)
    .where(and(eq(sfProjects.id, projectId), eq(sfProjects.userId, userId)))
    .returning({ id: sfProjects.id });

  return rows.length > 0;
}

/**
 * Autosave write: upsert every piece by client-generated id and prune rows
 * no longer present. Upsert-not-replace keeps piece ids stable so future
 * sf_placements FKs survive edits. Ownership is checked once up front.
 */
export async function replaceProjectPieces(
  projectId: string,
  userId: string,
  pieces: SavePiecePayload[],
): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDb();
  const owned = await db.query.sfProjects.findFirst({
    where: and(eq(sfProjects.id, projectId), eq(sfProjects.userId, userId)),
    columns: { id: true },
  });
  if (!owned) {
    return false;
  }

  if (pieces.length === 0) {
    await db.delete(sfPieces).where(eq(sfPieces.projectId, projectId));
  } else {
    await db
      .insert(sfPieces)
      .values(
        pieces.map((p) => ({
          id: p.id,
          projectId,
          kind: p.kind,
          label: p.label,
          polygon: p.polygon,
          cutouts: p.cutouts,
          veinLocked: p.veinLocked,
          sortOrder: p.sortOrder,
        })),
      )
      .onConflictDoUpdate({
        target: sfPieces.id,
        set: {
          kind: sql`excluded.kind`,
          label: sql`excluded.label`,
          polygon: sql`excluded.polygon`,
          cutouts: sql`excluded.cutouts`,
          veinLocked: sql`excluded.vein_locked`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: new Date(),
        },
        // Never let a colliding id hijack a piece from another project.
        setWhere: sql`${sfPieces.projectId} = ${projectId}`,
      });

    await db.delete(sfPieces).where(
      and(
        eq(sfPieces.projectId, projectId),
        notInArray(
          sfPieces.id,
          pieces.map((p) => p.id),
        ),
      ),
    );
  }

  await db
    .update(sfProjects)
    .set({ updatedAt: new Date() })
    .where(eq(sfProjects.id, projectId));

  return true;
}
