import {
  inflatePolygon,
  polygonAabb,
  rotateQuarter,
} from "@/lib/nesting/geometry";
import {
  compact,
  computeCellSizeIn,
  createOccupancyGrid,
  findBottomLeftFit,
  markBorderOccupied,
  markOccupied,
  rasterizePolygon,
  type Mask,
} from "@/lib/nesting/raster";
import type {
  NestPiece,
  NestPlacement,
  Point,
  SlabSource,
} from "@/lib/nesting/types";

type Rotation = 0 | 90 | 180 | 270;

function allowedRotations(veinLocked: boolean): Rotation[] {
  // 180° never flips grain direction; 90°/270° only when unlocked.
  return veinLocked ? [0, 180] : [0, 90, 180, 270];
}

/**
 * Packs as many pieces as fit onto a single slab. Pieces are tried in the
 * order given — the caller (nest.ts) controls global first-fit-decreasing
 * ordering; packSlab does not re-sort.
 *
 * `slabIndex` on returned placements is a placeholder (0) — packSlab has no
 * knowledge of its position in a multi-slab run; nest.ts fills it in.
 */
export function packSlab(
  pieces: NestPiece[],
  slab: SlabSource,
  marginIn: number,
): { placements: NestPlacement[]; leftover: NestPiece[] } {
  const cellIn = computeCellSizeIn(slab.widthIn, slab.heightIn);
  const { grid, cols, rows } = createOccupancyGrid(
    slab.widthIn,
    slab.heightIn,
    cellIn,
  );
  // Slab-edge buffer is marginIn/2, NOT marginIn: every piece polygon below
  // is also inflated by marginIn/2, so a piece flush against this border
  // ends up exactly marginIn from the true slab edge. Marking a full
  // marginIn border here would double-count and waste an extra half-margin
  // strip of perimeter on every layout.
  markBorderOccupied(grid, cols, rows, cellIn, marginIn / 2);

  const leftover: NestPiece[] = [];
  const placed: Array<{
    pieceId: string;
    rotation: Rotation;
    mask: Mask;
    r0: number;
    c0: number;
    /** True (non-inflated) piece polygon, rotated and shifted into the same
     * local frame as `mask` (i.e. relative to the inflated footprint's own
     * bbox origin). Absolute polygon = this + (c0,r0)*cellIn, computed after
     * compaction so it reflects the final position. */
    polyAtMaskOrigin: Point[];
  }> = [];

  for (const piece of pieces) {
    const inflated = inflatePolygon(piece.polygon, marginIn / 2);

    let best: {
      rotation: Rotation;
      mask: Mask;
      r0: number;
      c0: number;
      polyAtMaskOrigin: Point[];
    } | null = null;

    for (const rotation of allowedRotations(piece.veinLocked)) {
      const quarter = rotation / 90;
      const inflatedRotated = rotateQuarter(inflated, quarter);
      const aabb = polygonAabb(inflatedRotated);
      if (!aabb) continue;

      const shiftX = -aabb.minX;
      const shiftY = -aabb.minY;
      const inflatedAtOrigin = inflatedRotated.map((p) => ({
        x: p.x + shiftX,
        y: p.y + shiftY,
      }));
      // Same rotation + same shift, applied to the true polygon, keeps both
      // in one coordinate frame (see rotateQuarter's doc).
      const originalAtOrigin = rotateQuarter(piece.polygon, quarter).map(
        (p) => ({ x: p.x + shiftX, y: p.y + shiftY }),
      );

      const mask = rasterizePolygon(inflatedAtOrigin, cellIn);
      const pos = findBottomLeftFit(grid, cols, rows, mask);
      if (!pos) continue;

      if (
        !best ||
        pos.r0 < best.r0 ||
        (pos.r0 === best.r0 && pos.c0 < best.c0)
      ) {
        best = {
          rotation,
          mask,
          r0: pos.r0,
          c0: pos.c0,
          polyAtMaskOrigin: originalAtOrigin,
        };
      }
    }

    if (!best) {
      leftover.push(piece);
      continue;
    }

    markOccupied(grid, cols, best.mask, best.r0, best.c0);
    placed.push({ pieceId: piece.id, ...best });
  }

  // compact() mutates each entry's r0/c0 in place (and the grid) — placed
  // entries carry extra fields beyond {mask,r0,c0} but satisfy that shape.
  compact(grid, cols, rows, placed);

  const placements: NestPlacement[] = placed.map((p) => {
    const offsetXIn = p.c0 * cellIn;
    const offsetYIn = p.r0 * cellIn;
    const polygon = p.polyAtMaskOrigin.map((v) => ({
      x: Math.round((v.x + offsetXIn) * 100) / 100,
      y: Math.round((v.y + offsetYIn) * 100) / 100,
    }));
    const aabb = polygonAabb(polygon);

    return {
      pieceId: p.pieceId,
      slabIndex: 0,
      slab,
      xIn: aabb ? Math.round(aabb.minX * 100) / 100 : 0,
      yIn: aabb ? Math.round(aabb.minY * 100) / 100 : 0,
      rotation: p.rotation,
      polygon,
    };
  });

  return { placements, leftover };
}
