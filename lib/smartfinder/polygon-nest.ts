/**
 * Raster-based 2D nesting that respects true piece geometry (L-shapes,
 * notches) instead of treating every piece as its bounding box.
 *
 * Pieces are placed top-left first on a coarse occupancy grid. A piece with
 * `vertices` is rasterized as its real polygon (so two L-shapes can interlock);
 * a rectangular piece fills its whole bounding box. Rotations 0/90/180/270 are
 * tried. This is deterministic and good enough for the 1-8 countertop pieces
 * SmartFinder deals with; callers must gate on piece count before calling.
 */

import {
  pointInPolygon,
  polygonAabb,
  polygonAreaSqIn,
  rectPolygon,
  rotateNormalized,
} from "@/lib/smartfinder/geometry";
import type { NestResult, NestedPiece } from "@/lib/smartfinder/nest";
import type { Piece, PieceVertex } from "@/lib/smartfinder/types";

/** Keep the occupancy grid bounded regardless of slab size. */
const MAX_GRID_CELLS = 2600;
const MIN_CELL_IN = 0.5;

type Shape = {
  /** Polygon (already normalized so min x/y = 0), in inches. */
  poly: PieceVertex[];
  widthIn: number;
  heightIn: number;
  rotated: boolean;
};

function polyKey(poly: PieceVertex[]): string {
  return poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(";");
}

/** Distinct orientations for a piece (dedupes squares/symmetric shapes). */
function shapesForPiece(piece: Piece): Shape[] {
  const hasPoly = Boolean(piece.vertices && piece.vertices.length >= 3);
  const base: PieceVertex[] = hasPoly
    ? piece.vertices!.map((v) => ({ x: v.x, y: v.y }))
    : rectPolygon(piece.widthIn, piece.heightIn);

  const normalizedBase = rotateNormalized(base, 0);
  const quarters = hasPoly ? [0, 1, 2, 3] : [0, 1];
  const shapes: Shape[] = [];
  const seen = new Set<string>();

  for (const q of quarters) {
    const poly = rotateNormalized(normalizedBase, q);
    const aabb = polygonAabb(poly);
    if (!aabb) continue;
    const key = polyKey(poly);
    if (seen.has(key)) continue;
    seen.add(key);
    shapes.push({
      poly,
      widthIn: aabb.widthIn,
      heightIn: aabb.heightIn,
      rotated: q !== 0,
    });
  }

  return shapes;
}

type Mask = {
  cols: number;
  rows: number;
  /** Local occupied cell offsets [dr, dc] within the mask bbox. */
  offsets: Array<[number, number]>;
};

function rasterize(shape: Shape, cell: number): Mask {
  const cols = Math.max(1, Math.round(shape.widthIn / cell));
  const rows = Math.max(1, Math.round(shape.heightIn / cell));
  const offsets: Array<[number, number]> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cell;
      const cy = (r + 0.5) * cell;
      if (pointInPolygon(cx, cy, shape.poly)) offsets.push([r, c]);
    }
  }

  // Degenerate slivers may miss every cell center; keep at least one cell.
  if (offsets.length === 0) offsets.push([0, 0]);
  return { cols, rows, offsets };
}

function firstFit(
  grid: Uint8Array,
  gridCols: number,
  gridRows: number,
  mask: Mask,
): { r0: number; c0: number } | null {
  const maxR = gridRows - mask.rows;
  const maxC = gridCols - mask.cols;
  if (maxR < 0 || maxC < 0) return null;

  for (let r0 = 0; r0 <= maxR; r0++) {
    for (let c0 = 0; c0 <= maxC; c0++) {
      let ok = true;
      for (const [dr, dc] of mask.offsets) {
        if (grid[(r0 + dr) * gridCols + (c0 + dc)] === 1) {
          ok = false;
          break;
        }
      }
      if (ok) return { r0, c0 };
    }
  }
  return null;
}

/**
 * Nest pieces on a slab honouring real polygon outlines.
 * Placements carry `points` (absolute polygon, inches) for to-scale rendering.
 */
export function nestPolygonPieces(
  slabWidthIn: number,
  slabHeightIn: number,
  pieces: Piece[],
): NestResult {
  const cellByArea = Math.sqrt((slabWidthIn * slabHeightIn) / MAX_GRID_CELLS);
  const cell = Math.max(MIN_CELL_IN, cellByArea);
  const gridCols = Math.max(1, Math.ceil(slabWidthIn / cell));
  const gridRows = Math.max(1, Math.ceil(slabHeightIn / cell));
  const grid = new Uint8Array(gridCols * gridRows);

  const ordered = [...pieces].sort((a, b) => pieceArea(b) - pieceArea(a));

  const placements: NestedPiece[] = [];
  const oversized: string[] = [];
  const unplaced: Piece[] = [];

  for (const piece of ordered) {
    const shapes = shapesForPiece(piece);
    let best: {
      shape: Shape;
      mask: Mask;
      r0: number;
      c0: number;
    } | null = null;

    for (const shape of shapes) {
      const mask = rasterize(shape, cell);
      const pos = firstFit(grid, gridCols, gridRows, mask);
      if (!pos) continue;
      if (
        !best ||
        pos.r0 < best.r0 ||
        (pos.r0 === best.r0 && pos.c0 < best.c0)
      ) {
        best = { shape, mask, r0: pos.r0, c0: pos.c0 };
      }
    }

    if (!best) {
      oversized.push(piece.label);
      unplaced.push(piece);
      continue;
    }

    for (const [dr, dc] of best.mask.offsets) {
      grid[(best.r0 + dr) * gridCols + (best.c0 + dc)] = 1;
    }

    const offsetX = best.c0 * cell;
    const offsetY = best.r0 * cell;
    const points = best.shape.poly.map((v) => ({
      x: Math.round((v.x + offsetX) * 100) / 100,
      y: Math.round((v.y + offsetY) * 100) / 100,
    }));

    placements.push({
      label: piece.label,
      x: Math.round(offsetX * 100) / 100,
      y: Math.round(offsetY * 100) / 100,
      w: Math.round(best.shape.widthIn * 100) / 100,
      h: Math.round(best.shape.heightIn * 100) / 100,
      rotated: best.shape.rotated,
      points,
    });
  }

  return {
    placements,
    placed: unplaced.length === 0 && placements.length === pieces.length,
    oversized,
    unplaced,
    slabWidthIn,
    slabHeightIn,
  };
}

function pieceArea(piece: Piece): number {
  if (piece.vertices && piece.vertices.length >= 3) {
    return polygonAreaSqIn(piece.vertices);
  }
  return piece.widthIn * piece.heightIn;
}
