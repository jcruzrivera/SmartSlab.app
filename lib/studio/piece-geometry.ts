/**
 * Geometry operations for the Layout Studio piece editor.
 * All coordinates are inches; polygons follow the SfPolygon {x,y}[] shape
 * shared with lib/smartfinder/geometry.ts and lib/nesting/.
 */

import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";
import {
  polygonAabb,
  polygonAreaSqIn,
  rectPolygon,
  rotateNormalized,
} from "@/lib/smartfinder/geometry";

const EPS = 0.01;
const MIN_EDGE_IN = 0.5;
const MIN_AREA_SQIN = 1;

/** Every edge is axis-aligned within epsilon. */
export function isRectilinear(poly: SfPolygon, epsilon = EPS): boolean {
  if (poly.length < 3) return false;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    if (dx > epsilon && dy > epsilon) return false;
  }
  return true;
}

/** Four vertices, all edges axis-aligned. */
export function isRect(poly: SfPolygon): boolean {
  return poly.length === 4 && isRectilinear(poly);
}

/** Length of edge i (from vertex i to vertex i+1 mod n). */
export function edgeLength(poly: SfPolygon, i: number): number {
  const a = poly[i]!;
  const b = poly[(i + 1) % poly.length]!;
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Snap to the editor's 0.25in grid. */
export function snapQuarter(n: number): number {
  return Math.round(n * 4) / 4;
}

/**
 * Resize edge i of a rectilinear polygon to newLen.
 *
 * Rect: rebuild with rectPolygon anchored at (minX, minY) — a horizontal
 * edge sets width, a vertical edge sets height.
 *
 * General rectilinear: translate exactly v_{i+1} and v_{i+2} by
 * delta * direction(edge i). Edge i takes the new length, the
 * perpendicular edge i+1 is carried along, and the parallel edge i+2
 * absorbs the delta ("stretch the run").
 *
 * Returns null when the polygon is not rectilinear, newLen is invalid, or
 * the result would collapse (any edge < 0.5in or area < 1 sq in).
 */
export function resizeEdge(
  poly: SfPolygon,
  i: number,
  newLen: number,
): SfPolygon | null {
  if (!Number.isFinite(newLen) || newLen <= 0) return null;
  if (i < 0 || i >= poly.length) return null;
  if (!isRectilinear(poly)) return null;

  const currentLen = edgeLength(poly, i);
  if (currentLen < EPS) return null;

  if (isRect(poly)) {
    const aabb = polygonAabb(poly);
    if (!aabb) return null;
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const horizontal = Math.abs(b.y - a.y) <= EPS;
    const w = horizontal ? newLen : aabb.widthIn;
    const h = horizontal ? aabb.heightIn : newLen;
    const rebuilt = rectPolygon(w, h).map((v) => ({
      x: v.x + aabb.minX,
      y: v.y + aabb.minY,
    }));
    return checkResult(rebuilt);
  }

  const n = poly.length;
  const a = poly[i]!;
  const b = poly[(i + 1) % n]!;
  const dirX = (b.x - a.x) / currentLen;
  const dirY = (b.y - a.y) / currentLen;
  const delta = newLen - currentLen;

  const result = poly.map((v) => ({ x: v.x, y: v.y }));
  for (const idx of [(i + 1) % n, (i + 2) % n]) {
    result[idx] = {
      x: result[idx]!.x + delta * dirX,
      y: result[idx]!.y + delta * dirY,
    };
  }

  return checkResult(result);
}

function checkResult(poly: SfPolygon): SfPolygon | null {
  for (let i = 0; i < poly.length; i++) {
    if (edgeLength(poly, i) < MIN_EDGE_IN) return null;
  }
  if (polygonAreaSqIn(poly) < MIN_AREA_SQIN) return null;
  return poly;
}

/**
 * Rotate a piece 90° clockwise together with its cutouts.
 * Piece polygon: rotateNormalized(polygon, 1) — for a shape spanning
 * [0,W]x[0,H] this maps (x,y) → (y, W−x). Each cutout rotates its own
 * polygon and remaps its offset by rotating its placed bbox center through
 * the same transform.
 */
export function rotatePieceWithCutouts(piece: {
  polygon: SfPolygon;
  cutouts: SfCutout[];
}): { polygon: SfPolygon; cutouts: SfCutout[] } {
  const aabb = polygonAabb(piece.polygon);
  if (!aabb) return { polygon: piece.polygon, cutouts: piece.cutouts };

  const w = aabb.widthIn;
  const polygon = rotateNormalized(
    piece.polygon.map((v) => ({ x: v.x - aabb.minX, y: v.y - aabb.minY })),
    1,
  );

  const cutouts = piece.cutouts.map((c) => {
    const cbb = polygonAabb(c.polygon);
    if (!cbb) return c;
    const cx = c.offsetX + cbb.widthIn / 2;
    const cy = c.offsetY + cbb.heightIn / 2;
    // (x,y) → (y, W−x) applied to the placed center.
    const newCx = cy;
    const newCy = w - cx;
    const newPoly = rotateNormalized(c.polygon, 1);
    // Rotated cutout bbox dims swap.
    return {
      ...c,
      polygon: newPoly,
      offsetX: newCx - cbb.heightIn / 2,
      offsetY: newCy - cbb.widthIn / 2,
    };
  });

  return { polygon, cutouts };
}

/**
 * Clamp a cutout's offset so its bbox stays inside the piece's bbox.
 * Bbox-only containment (a cutout may still overlap an L-notch visually) —
 * accepted for the minimal editor scope.
 */
export function clampCutoutOffset(
  piecePoly: SfPolygon,
  cutout: SfCutout,
  ox: number,
  oy: number,
): { offsetX: number; offsetY: number } {
  const pieceBb = polygonAabb(piecePoly);
  const cutBb = polygonAabb(cutout.polygon);
  if (!pieceBb || !cutBb) return { offsetX: ox, offsetY: oy };

  const minX = pieceBb.minX;
  const minY = pieceBb.minY;
  const maxX = pieceBb.maxX - cutBb.widthIn;
  const maxY = pieceBb.maxY - cutBb.heightIn;

  return {
    offsetX: Math.min(Math.max(ox, minX), Math.max(minX, maxX)),
    offsetY: Math.min(Math.max(oy, minY), Math.max(minY, maxY)),
  };
}
