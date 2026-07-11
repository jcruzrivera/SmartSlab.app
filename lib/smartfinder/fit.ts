import type { SlabWithRelations } from "@/lib/db/slabs";
import type { FitResult, Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** Slab face area in square feet (width × height are stored in inches). */
function slabSqft(slab: SlabWithRelations): number | null {
  const w = num(slab.widthIn);
  const h = num(slab.heightIn);
  if (w === null || h === null || w <= 0 || h <= 0) return null;
  return (w * h) / 144;
}

/** Sum of all piece areas in square feet. */
function totalPieceSqft(pieces: Piece[]): number {
  return pieces.reduce((sum, p) => sum + (p.widthIn * p.heightIn) / 144, 0);
}

/* ------------------------------------------------------------------ */
/*  Core fitting logic                                                */
/* ------------------------------------------------------------------ */

/**
 * Determines whether each piece fits within the slab face (can be
 * rotated 90°) and returns a scored result.
 *
 * The algorithm is intentionally simple — a greedy area-based check
 * rather than a full 2-D bin-packing solver.  This is fine for the
 * typical case of 1-4 countertop pieces from a single slab and keeps
 * the implementation deterministic and easy to reason about.
 *
 * Scoring factors (all normalised to 0–100):
 *   • 50 pts — geometric fit (pieces fit within slab dimensions)
 *   • 30 pts — low waste (inverted waste %)
 *   • 20 pts — value (lower price-per-usable-sqft is better)
 */
export function calculateFit(
  slab: SlabWithRelations,
  pieces: Piece[],
): FitResult | null {
  if (pieces.length === 0) return null;

  const sqft = slabSqft(slab);
  if (sqft === null || sqft <= 0) return null;

  const slabW = num(slab.widthIn)!;
  const slabH = num(slab.heightIn)!;
  const pieceSqft = totalPieceSqft(pieces);

  if (pieceSqft <= 0) return null;

  // Check which pieces are geometrically oversized for the slab
  const oversizedPieces: string[] = [];

  for (const piece of pieces) {
    const fitsNormal = piece.widthIn <= slabW && piece.heightIn <= slabH;
    const fitsRotated = piece.heightIn <= slabW && piece.widthIn <= slabH;
    if (!fitsNormal && !fitsRotated) {
      oversizedPieces.push(piece.label);
    }
  }

  const fits = oversizedPieces.length === 0 && pieceSqft <= sqft;

  // Waste percentage (capped at 100 in degenerate cases)
  const wastePercent = fits
    ? Math.min(((sqft - pieceSqft) / sqft) * 100, 100)
    : Math.max(((pieceSqft - sqft) / pieceSqft) * 100, 0);

  // Price per usable sq ft
  const price = num(slab.price);
  const pricePerUsableSqft =
    price !== null && pieceSqft > 0 ? price / Math.min(pieceSqft, sqft) : null;

  // ---- Score computation -------------------------------------------
  // Geometric fit (50 pts)
  let geoScore: number;
  if (fits) {
    geoScore = 50;
  } else if (oversizedPieces.length === 0) {
    // Pieces all fit dimensionally, but total area exceeds the slab.
    // Partial credit proportional to how close the areas are.
    const ratio = sqft / pieceSqft;
    geoScore = Math.max(0, Math.round(ratio * 35));
  } else {
    // Some pieces literally can't be cut from this slab shape.
    geoScore = 0;
  }

  // Waste score (30 pts) — lower waste is better
  const wasteScore = fits ? Math.round((1 - wastePercent / 100) * 30) : 0;

  // Value score (20 pts) — cheaper per usable sqft is better.
  // We normalise against a reference of $50/sqft (anything under gets
  // full marks; anything at $200+/sqft gets 0).
  let valueScore = 0;
  if (pricePerUsableSqft !== null) {
    const clamped = Math.max(0, Math.min(pricePerUsableSqft, 200));
    valueScore = Math.round((1 - clamped / 200) * 20);
  }

  const fitScore = geoScore + wasteScore + valueScore;

  return {
    slab,
    fitScore,
    totalPieceSqft: Math.round(pieceSqft * 10) / 10,
    slabSqft: Math.round(sqft * 10) / 10,
    wastePercent: Math.round(wastePercent * 10) / 10,
    fits,
    oversizedPieces,
    pricePerUsableSqft:
      pricePerUsableSqft !== null
        ? Math.round(pricePerUsableSqft * 100) / 100
        : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Rank all slabs                                                    */
/* ------------------------------------------------------------------ */

/**
 * Evaluate every slab against the buyer's pieces and return results
 * sorted by fitScore descending.
 *
 * When `includeUnscored` is true (own inventory), slabs missing dimensions
 * are kept with score 0 so vendors still see them instead of a silent drop.
 */
export function rankSlabs(
  slabs: SlabWithRelations[],
  pieces: Piece[],
  options: { includeUnscored?: boolean } = {},
): FitResult[] {
  const results: FitResult[] = [];

  for (const slab of slabs) {
    const result = calculateFit(slab, pieces);
    if (result) {
      results.push(result);
      continue;
    }

    if (!options.includeUnscored) continue;

    // Surface own inventory even when dimensions are incomplete.
    results.push({
      slab,
      fitScore: 0,
      totalPieceSqft: Math.round(totalPieceSqft(pieces) * 10) / 10,
      slabSqft: 0,
      wastePercent: 100,
      fits: false,
      oversizedPieces: ["Missing slab dimensions — edit listing to enable fit"],
      pricePerUsableSqft: null,
    });
  }

  results.sort((a, b) => {
    if (a.fits !== b.fits) return a.fits ? -1 : 1;
    return b.fitScore - a.fitScore;
  });

  return results;
}
