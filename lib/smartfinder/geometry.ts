import type { Piece, PieceVertex } from "@/lib/smartfinder/types";

const MAX_VERTICES = 200;

/** Absolute area of a polygon via the shoelace formula (square inches). */
export function polygonAreaSqIn(vertices: PieceVertex[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Axis-aligned bounding box of vertices (inches). */
export function polygonAabb(vertices: PieceVertex[]): {
  widthIn: number;
  heightIn: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (vertices.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  const widthIn = maxX - minX;
  const heightIn = maxY - minY;
  if (!(widthIn > 0) || !(heightIn > 0)) return null;
  return { widthIn, heightIn, minX, minY, maxX, maxY };
}

/** Piece face area in sq ft — polygon when available, else width×height. */
export function pieceAreaSqft(piece: Piece): number {
  if (piece.vertices && piece.vertices.length >= 3) {
    return polygonAreaSqIn(piece.vertices) / 144;
  }
  return (piece.widthIn * piece.heightIn) / 144;
}

export function normalizeVertices(
  raw: unknown,
): PieceVertex[] | undefined {
  if (!Array.isArray(raw) || raw.length < 3 || raw.length > MAX_VERTICES) {
    return undefined;
  }

  const vertices: PieceVertex[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return undefined;
    const { x, y } = item as Record<string, unknown>;
    const nx = typeof x === "number" ? x : Number(x);
    const ny = typeof y === "number" ? y : Number(y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return undefined;
    vertices.push({
      x: Math.round(nx * 1000) / 1000,
      y: Math.round(ny * 1000) / 1000,
    });
  }

  // Drop duplicate closing vertex if present.
  const first = vertices[0]!;
  const last = vertices[vertices.length - 1]!;
  if (
    vertices.length > 3 &&
    Math.abs(first.x - last.x) < 1e-6 &&
    Math.abs(first.y - last.y) < 1e-6
  ) {
    vertices.pop();
  }

  return vertices.length >= 3 ? vertices : undefined;
}

/** SVG path `d` for a mini preview (vertices translated to 0,0). */
export function verticesToSvgPath(vertices: PieceVertex[]): string | null {
  const aabb = polygonAabb(vertices);
  if (!aabb) return null;
  const pts = vertices.map(
    (v) => `${v.x - aabb.minX},${aabb.maxY - v.y}`,
  );
  return `M${pts.join(" L")} Z`;
}
