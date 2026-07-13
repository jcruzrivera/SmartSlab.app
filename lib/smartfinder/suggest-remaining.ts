import { nestPiecesOnSlab } from "@/lib/smartfinder/nest";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";

/** True when every remaining piece nests on this candidate slab. */
export function candidateFitsRemaining(
  result: SmartFinderResult,
  remaining: Piece[],
): boolean {
  if (remaining.length === 0) return false;
  const w = result.widthIn != null ? Number(result.widthIn) : NaN;
  const h = result.heightIn != null ? Number(result.heightIn) : NaN;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return false;
  }
  return nestPiecesOnSlab(w, h, remaining).placed;
}

/**
 * Pick alternative slabs for leftover pieces: own inventory first, then
 * marketplace. Excludes the slab currently being viewed.
 */
export function suggestSlabsForRemaining(input: {
  remaining: Piece[];
  currentSlabId: string;
  ownResults?: SmartFinderResult[];
  marketResults?: SmartFinderResult[];
  limit?: number;
}): {
  own: SmartFinderResult[];
  market: SmartFinderResult[];
} {
  const limit = input.limit ?? 3;
  const own = (input.ownResults ?? [])
    .filter((r) => r.slabId !== input.currentSlabId)
    .filter((r) => candidateFitsRemaining(r, input.remaining))
    .slice(0, limit);
  const market = (input.marketResults ?? [])
    .filter((r) => r.slabId !== input.currentSlabId)
    .filter((r) => candidateFitsRemaining(r, input.remaining))
    .slice(0, limit);
  return { own, market };
}
