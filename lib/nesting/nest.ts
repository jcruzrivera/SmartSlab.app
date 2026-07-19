import { polygonAabb, polygonAreaSqIn } from "@/lib/nesting/geometry";
import { packSlab } from "@/lib/nesting/pack-slab";
import type {
  NestError,
  NestInput,
  NestPiece,
  NestPlacement,
  NestResult,
  SlabSource,
} from "@/lib/nesting/types";

export const NESTING_ENGINE_VERSION = "rect-raster-v1";

function slabAreaSqft(slab: SlabSource): number {
  return (slab.widthIn * slab.heightIn) / 144;
}

function pieceAreaSqft(piece: NestPiece): number {
  return polygonAreaSqIn(piece.polygon) / 144;
}

/** Coarse dimensional check (margin-inflated AABB, either allowed rotation)
 * used only to classify an unplaceable piece's error reason — not used for
 * actual packing, which happens in packSlab via true raster collision. */
function pieceFitsSlabDims(
  piece: NestPiece,
  marginIn: number,
  slab: SlabSource,
): boolean {
  const aabb = polygonAabb(piece.polygon);
  if (!aabb) return false;

  // Piece needs marginIn/2 clearance from the slab edge on each side of
  // each dimension, i.e. marginIn total per dimension (see pack-slab.ts's
  // border-vs-inflation note).
  const usableW = slab.widthIn - marginIn;
  const usableH = slab.heightIn - marginIn;
  if (usableW <= 0 || usableH <= 0) return false;

  const orientations: Array<[number, number]> = piece.veinLocked
    ? [[aabb.widthIn, aabb.heightIn]]
    : [
        [aabb.widthIn, aabb.heightIn],
        [aabb.heightIn, aabb.widthIn],
      ];

  return orientations.some(([w, h]) => w <= usableW && h <= usableH);
}

function virtualSlabFromTemplate(
  template: NonNullable<NestInput["virtualSlabTemplate"]>,
): SlabSource {
  return {
    kind: "virtual",
    widthIn: template.widthIn,
    heightIn: template.heightIn,
    material: template.material,
    price: template.price,
  };
}

export function nest(input: NestInput): NestResult {
  const { pieces, slabs, marginIn, allowNewVirtualSlabs, virtualSlabTemplate } =
    input;

  if (allowNewVirtualSlabs && !virtualSlabTemplate) {
    throw new Error(
      "nest(): allowNewVirtualSlabs is true but no virtualSlabTemplate was provided.",
    );
  }

  let remaining: NestPiece[] = [...pieces].sort(
    (a, b) => pieceAreaSqft(b) - pieceAreaSqft(a),
  );

  const allPlacements: NestPlacement[] = [];
  const slabsUsedList: SlabSource[] = [];

  // Phase A: try each explicitly offered slab, in order. Every remaining
  // piece gets a fresh shot at each subsequent slab (a bigger/differently
  // shaped slab later in the list may fit a piece an earlier one couldn't).
  for (const slab of slabs) {
    if (remaining.length === 0) break;
    const { placements, leftover } = packSlab(remaining, slab, marginIn);
    if (placements.length > 0) {
      const slabNumber = slabsUsedList.length + 1;
      for (const p of placements) {
        allPlacements.push({ ...p, slabIndex: slabNumber });
      }
      slabsUsedList.push(slab);
    }
    remaining = leftover;
  }

  // Phase B: synthesize additional slabs from the template, one at a time,
  // stopping as soon as a fresh slab places nothing (further identical
  // slabs would also place nothing — avoids an infinite loop). Bounded by
  // pieces.length+1 as a hard safety cap, independent of the shrinking
  // `remaining` array (a loop bound tied to a mutating array's own length
  // can exit early once the array shrinks past the counter).
  if (allowNewVirtualSlabs && virtualSlabTemplate) {
    const maxNewSlabs = pieces.length + 1;
    for (let i = 0; i < maxNewSlabs && remaining.length > 0; i++) {
      const slab = virtualSlabFromTemplate(virtualSlabTemplate);
      const { placements, leftover } = packSlab(remaining, slab, marginIn);
      if (placements.length === 0) break;

      const slabNumber = slabsUsedList.length + 1;
      for (const p of placements) {
        allPlacements.push({ ...p, slabIndex: slabNumber });
      }
      slabsUsedList.push(slab);
      remaining = leftover;
    }
  }

  const combinedCandidates: SlabSource[] =
    allowNewVirtualSlabs && virtualSlabTemplate
      ? [...slabs, virtualSlabFromTemplate(virtualSlabTemplate)]
      : slabs;

  const unplaced: NestError[] = remaining.map((piece) => {
    const fitsSomeSlab = combinedCandidates.some((slab) =>
      pieceFitsSlabDims(piece, marginIn, slab),
    );
    return {
      pieceId: piece.id,
      label: piece.label,
      reason: fitsSomeSlab ? "no_room_on_any_slab" : "no_slab_fits",
      message: fitsSomeSlab
        ? `"${piece.label}" would fit on a slab, but no slab had room left for it.`
        : `"${piece.label}" is larger than every available slab, even with ${marginIn}" margin applied.`,
    };
  });

  const totalPieceSqft = pieces.reduce((sum, p) => sum + pieceAreaSqft(p), 0);
  const totalSlabSqft = slabsUsedList.reduce(
    (sum, s) => sum + slabAreaSqft(s),
    0,
  );
  const wastePct =
    totalSlabSqft > 0
      ? Math.round(((totalSlabSqft - totalPieceSqft) / totalSlabSqft) * 10000) /
        100
      : 0;

  return {
    placements: allPlacements,
    slabsUsed: slabsUsedList.length,
    slabsUsedList,
    totalPieceSqft: Math.round(totalPieceSqft * 100) / 100,
    totalSlabSqft: Math.round(totalSlabSqft * 100) / 100,
    wastePct,
    unplaced,
  };
}
