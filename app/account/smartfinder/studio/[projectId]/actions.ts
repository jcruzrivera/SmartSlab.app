"use server";

import { isDbConfigured } from "@/lib/db/client";
import { replaceProjectPieces } from "@/lib/db/sfProjects";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { normalizeVertices } from "@/lib/smartfinder/geometry";
import { savePiecesSchema } from "@/lib/validations/studio";

export type SavePiecesResult = {
  ok: boolean;
  error?: string;
  savedAt?: number;
};

/**
 * Autosave endpoint for the studio editor. Called imperatively from the
 * client store's debounced save — deliberately no revalidatePath: while the
 * editor is open, the client is the source of truth.
 */
export async function savePiecesAction(
  payload: unknown,
): Promise<SavePiecesResult> {
  if (!isDbConfigured()) {
    return { ok: false, error: "The database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = savePiecesSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid pieces payload." };
  }

  const pieces = [];
  for (const piece of parsed.data.pieces) {
    const polygon = normalizeVertices(piece.polygon);
    if (!polygon) {
      return { ok: false, error: `Piece "${piece.label}" has invalid geometry.` };
    }
    pieces.push({ ...piece, polygon });
  }

  try {
    const ok = await replaceProjectPieces(
      parsed.data.projectId,
      user.id,
      pieces,
    );
    if (!ok) {
      return { ok: false, error: "Project not found." };
    }
  } catch {
    return { ok: false, error: "Could not save. Retrying may help." };
  }

  return { ok: true, savedAt: Date.now() };
}
