import type { Piece } from "@/lib/smartfinder/types";

export type NestedPiece = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
};

export type NestResult = {
  placements: NestedPiece[];
  placed: boolean;
  oversized: string[];
  slabWidthIn: number;
  slabHeightIn: number;
};

/**
 * Simple shelf packing with optional 90° rotation.
 * Places pieces left-to-right on horizontal shelves; starts a new shelf
 * when the current one is full. Good enough for silhouette preview (v1).
 */
export function nestPiecesOnSlab(
  slabWidthIn: number,
  slabHeightIn: number,
  pieces: Piece[],
): NestResult {
  const oversized: string[] = [];
  const placements: NestedPiece[] = [];

  if (
    !Number.isFinite(slabWidthIn) ||
    !Number.isFinite(slabHeightIn) ||
    slabWidthIn <= 0 ||
    slabHeightIn <= 0 ||
    pieces.length === 0
  ) {
    return {
      placements: [],
      placed: false,
      oversized: pieces.map((p) => p.label),
      slabWidthIn,
      slabHeightIn,
    };
  }

  // Largest-first tends to pack better for countertop pieces.
  const ordered = [...pieces].sort(
    (a, b) => b.widthIn * b.heightIn - a.widthIn * a.heightIn,
  );

  let shelfY = 0;
  let shelfHeight = 0;
  let cursorX = 0;

  for (const piece of ordered) {
    const orientations = [
      { w: piece.widthIn, h: piece.heightIn, rotated: false },
      { w: piece.heightIn, h: piece.widthIn, rotated: true },
    ].filter(
      (o, index, arr) =>
        // Drop duplicate orientation when square
        index === arr.findIndex((x) => x.w === o.w && x.h === o.h),
    );

    const fitsSlab = orientations.some(
      (o) => o.w <= slabWidthIn && o.h <= slabHeightIn,
    );
    if (!fitsSlab) {
      oversized.push(piece.label);
      continue;
    }

    let placed = false;

    // Prefer orientation that fits on the current shelf; else start a new shelf.
    for (const attempt of [false, true] as const) {
      for (const o of orientations) {
        if (o.w > slabWidthIn || o.h > slabHeightIn) continue;

        let nextX = cursorX;
        let nextY = shelfY;
        let nextShelfH = shelfHeight;

        if (!attempt) {
          // Try current shelf
          if (cursorX + o.w > slabWidthIn + 1e-6) continue;
          if (o.h > shelfHeight && shelfY + o.h > slabHeightIn + 1e-6) continue;
          nextShelfH = Math.max(shelfHeight, o.h);
        } else {
          // New shelf under the previous one
          nextX = 0;
          nextY = shelfY + shelfHeight;
          nextShelfH = o.h;
          if (nextY + o.h > slabHeightIn + 1e-6) continue;
          if (o.w > slabWidthIn + 1e-6) continue;
        }

        placements.push({
          label: piece.label,
          x: nextX,
          y: nextY,
          w: o.w,
          h: o.h,
          rotated: o.rotated,
        });

        if (attempt) {
          shelfY = nextY;
          shelfHeight = nextShelfH;
          cursorX = o.w;
        } else {
          shelfHeight = nextShelfH;
          cursorX = nextX + o.w;
        }

        placed = true;
        break;
      }
      if (placed) break;
    }

    if (!placed) {
      oversized.push(piece.label);
    }
  }

  return {
    placements,
    placed: oversized.length === 0 && placements.length === pieces.length,
    oversized,
    slabWidthIn,
    slabHeightIn,
  };
}
