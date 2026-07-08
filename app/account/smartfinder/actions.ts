"use server";

import { listPublicSlabs } from "@/lib/db/slabs";
import { rankSlabs } from "@/lib/smartfinder/fit";
import type { FitResult, Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Serializable result type (no class instances, no circular refs)   */
/* ------------------------------------------------------------------ */

export type SmartFinderResult = {
  slabId: string;
  slabName: string;
  materialName: string | null;
  colorFamily: string | null;
  vendorCompany: string | null;
  imageUrl: string | null;
  price: string;
  pricePerSqft: string | null;
  type: string;
  widthIn: string | null;
  heightIn: string | null;
  city: string | null;
  state: string | null;
  fitScore: number;
  totalPieceSqft: number;
  slabSqft: number;
  wastePercent: number;
  fits: boolean;
  oversizedPieces: string[];
  pricePerUsableSqft: number | null;
  isNegotiable: boolean;
  quantity: number;
};

function toSerializable(result: FitResult): SmartFinderResult {
  const { slab } = result;
  const primaryImage =
    slab.images.find((img) => img.isPrimary)?.url ?? slab.images[0]?.url ?? null;

  return {
    slabId: slab.id,
    slabName: slab.name,
    materialName: slab.material?.name ?? null,
    colorFamily: slab.colorFamily,
    vendorCompany: slab.vendor?.companyName ?? null,
    imageUrl: primaryImage,
    price: slab.price,
    pricePerSqft: slab.pricePerSqft,
    type: slab.type,
    widthIn: slab.widthIn,
    heightIn: slab.heightIn,
    city: slab.city,
    state: slab.state,
    fitScore: result.fitScore,
    totalPieceSqft: result.totalPieceSqft,
    slabSqft: result.slabSqft,
    wastePercent: result.wastePercent,
    fits: result.fits,
    oversizedPieces: result.oversizedPieces,
    pricePerUsableSqft: result.pricePerUsableSqft,
    isNegotiable: slab.isNegotiable,
    quantity: slab.quantity,
  };
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function validatePieces(raw: unknown): Piece[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;

  const pieces: Piece[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { label, widthIn, heightIn } = item as Record<string, unknown>;
    if (typeof label !== "string" || !label.trim()) return null;
    if (typeof widthIn !== "number" || widthIn <= 0 || widthIn > 600) return null;
    if (typeof heightIn !== "number" || heightIn <= 0 || heightIn > 600) return null;
    pieces.push({
      label: label.trim(),
      widthIn: Math.round(widthIn * 100) / 100,
      heightIn: Math.round(heightIn * 100) / 100,
    });
  }

  return pieces;
}

/* ------------------------------------------------------------------ */
/*  Server action                                                      */
/* ------------------------------------------------------------------ */

const FREE_RESULT_LIMIT = 3;

export async function findMatchingSlabs(
  rawPieces: Piece[],
): Promise<{
  results: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
}> {
  const pieces = validatePieces(rawPieces);
  if (!pieces) {
    return { results: [], totalMatches: 0, limited: false };
  }

  // Fetch all available public slabs
  const slabs = await listPublicSlabs({ limit: 200 });

  // Rank them against the buyer's pieces
  const ranked = rankSlabs(slabs, pieces);

  // For now, all authenticated users get the free tier.
  // When subscription is wired up, check the user's plan here.
  const isSubscriber = false;

  const limit = isSubscriber ? ranked.length : FREE_RESULT_LIMIT;
  const limited = !isSubscriber && ranked.length > FREE_RESULT_LIMIT;

  return {
    results: ranked.slice(0, limit).map(toSerializable),
    totalMatches: ranked.length,
    limited,
  };
}
