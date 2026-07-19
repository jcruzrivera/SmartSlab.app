import {
  pointInPolygon,
  polygonAabb,
  polygonAreaSqIn,
  rectPolygon,
  rotateNormalized,
} from "@/lib/smartfinder/geometry";
import type { Point } from "@/lib/nesting/types";

export {
  pointInPolygon,
  polygonAabb,
  polygonAreaSqIn,
  rectPolygon,
  rotateNormalized,
};

function edgeDir(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

/** Rotate a unit vector by ±90°. cw=false rotates +90° (CCW), true rotates -90° (CW). */
function rotate90(v: Point, cw: boolean): Point {
  return cw ? { x: v.y, y: -v.x } : { x: -v.y, y: v.x };
}

/**
 * Rotate points by a multiple of 90° about the origin — no re-normalization.
 * Needed when two related polygons (an inflated footprint and the true piece
 * inside it) must stay in the same coordinate frame after rotating;
 * `rotateNormalized` (re-exported above) re-normalizes each call
 * independently, which would misalign the pair.
 */
export function rotateQuarter(polygon: Point[], quarter: number): Point[] {
  return polygon.map(({ x, y }) => {
    switch (((quarter % 4) + 4) % 4) {
      case 1:
        return { x: y, y: -x };
      case 2:
        return { x: -x, y: -y };
      case 3:
        return { x: -y, y: x };
      default:
        return { x, y };
    }
  });
}

/**
 * Rectilinear Minkowski-style outward buffer: offsets every edge of an
 * axis-aligned polygon outward by `amountIn` and returns the resulting
 * miter-joined polygon. Handles both convex and reflex (L-notch) corners
 * correctly — at a reflex corner "outward" means encroaching into the
 * concave pocket, which is exactly what should happen when the piece
 * inflates to claim its margin.
 *
 * Assumes every vertex is a genuine ~90°/270° turn (no collinear/redundant
 * points) — true for rectilinear piece polygons from the editor or a
 * cabinet-run generator, both of which only emit corner vertices.
 */
export function inflatePolygon(polygon: Point[], amountIn: number): Point[] {
  const n = polygon.length;
  if (n < 3 || amountIn === 0) return polygon.map((p) => ({ x: p.x, y: p.y }));

  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const p = polygon[i]!;
    const q = polygon[(i + 1) % n]!;
    signedArea += p.x * q.y - q.x * p.y;
  }
  // Positive signedArea => CCW (standard math orientation) => outward normal
  // is the -90° (clockwise) rotation of the edge direction. Negative => CW
  // winding => outward normal is the +90° (CCW) rotation instead.
  const cwNormal = signedArea >= 0;

  return polygon.map((v, i) => {
    const prev = polygon[(i - 1 + n) % n]!;
    const next = polygon[(i + 1) % n]!;
    const normalIn = rotate90(edgeDir(prev, v), cwNormal);
    const normalOut = rotate90(edgeDir(v, next), cwNormal);
    return {
      x: v.x + amountIn * (normalIn.x + normalOut.x),
      y: v.y + amountIn * (normalIn.y + normalOut.y),
    };
  });
}
