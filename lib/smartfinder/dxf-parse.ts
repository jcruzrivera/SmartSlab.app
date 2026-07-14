/**
 * Lightweight ASCII DXF geometry parser for SmartFinder piece extraction.
 *
 * Extracts closed LWPOLYLINE / POLYLINE outlines as single pieces (no
 * rectangle decomposition), converts units to inches, and associates nearby
 * TEXT / MTEXT labels. Falls back to empty when no usable closed shapes exist
 * so callers can still try the LLM path.
 */

import {
  polygonAabb,
  polygonAreaSqIn,
} from "@/lib/smartfinder/geometry";
import type { Piece, PieceVertex } from "@/lib/smartfinder/types";

const MAX_PIECES = 20;
const MAX_DIM_IN = 600;
const MIN_EDGE_IN = 0.5;
const MIN_AREA_SQ_IN = 4; // ignore tiny annotation boxes
const MAX_ASPECT_RATIO = 30; // reject leader lines / border strips
const LABEL_SEARCH_PAD_IN = 24;

/** Layer name tokens that never represent a cuttable stone outline. */
const ANNOTATION_LAYER_TOKENS = new Set([
  "DIM",
  "DIMS",
  "DIMENSION",
  "DIMENSIONS",
  "ANNO",
  "ANNOTATION",
  "TEXT",
  "NOTE",
  "NOTES",
  "TITLE",
  "TITLEBLOCK",
  "HATCH",
  "CENTER",
  "CENTRE",
  "HIDDEN",
  "DEFPOINTS",
  "LEADER",
  "SYMBOL",
  "GRID",
  "AXIS",
  "BORDER",
]);

function isAnnotationLayer(layer: string | null): boolean {
  if (!layer) return false;
  const tokens = layer.toUpperCase().split(/[^A-Z0-9]+/);
  return tokens.some((t) => ANNOTATION_LAYER_TOKENS.has(t));
}

type DxfPair = { code: number; value: string };

type TextLabel = {
  text: string;
  x: number;
  y: number;
};

export type DxfParseResult = {
  pieces: Piece[];
  unitsDetected: string;
};

/** AutoCAD $INSUNITS → inches multiplier. */
function unitsToInches(insunits: number): { factor: number; label: string } {
  switch (insunits) {
    case 1: // inches
      return { factor: 1, label: "in" };
    case 2: // feet
      return { factor: 12, label: "ft" };
    case 4: // mm
      return { factor: 1 / 25.4, label: "mm" };
    case 5: // cm
      return { factor: 1 / 2.54, label: "cm" };
    case 6: // m
      return { factor: 100 / 2.54, label: "m" };
    default:
      return { factor: 1, label: "in" };
  }
}

function parsePairs(text: string): DxfPair[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const pairs: DxfPair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number(lines[i]!.trim());
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1]!.trim() });
  }
  return pairs;
}

function readInsUnits(pairs: DxfPair[]): number {
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i]!.code === 9 && pairs[i]!.value === "$INSUNITS") {
      const next = pairs[i + 1]!;
      if (next.code === 70) {
        const n = Number(next.value);
        return Number.isFinite(n) ? n : 1;
      }
    }
  }
  return 1;
}

function entityBlocks(pairs: DxfPair[]): DxfPair[][] {
  const entitiesStart = pairs.findIndex(
    (p, i) =>
      p.code === 0 &&
      p.value === "SECTION" &&
      pairs[i + 1]?.code === 2 &&
      pairs[i + 1]?.value === "ENTITIES",
  );
  if (entitiesStart < 0) return [];

  const blocks: DxfPair[][] = [];
  let current: DxfPair[] | null = null;

  for (let i = entitiesStart + 2; i < pairs.length; i++) {
    const pair = pairs[i]!;
    if (pair.code === 0 && pair.value === "ENDSEC") break;
    if (pair.code === 0) {
      if (current && current.length > 0) blocks.push(current);
      current = [pair];
    } else if (current) {
      current.push(pair);
    }
  }
  if (current && current.length > 0) blocks.push(current);
  return blocks;
}

function entityType(block: DxfPair[]): string {
  return block[0]?.code === 0 ? block[0].value.toUpperCase() : "";
}

function almostEqual(a: number, b: number, eps = 1e-4): boolean {
  return Math.abs(a - b) <= eps;
}

function closeIfNeeded(verts: PieceVertex[]): PieceVertex[] {
  if (verts.length < 3) return verts;
  const first = verts[0]!;
  const last = verts[verts.length - 1]!;
  if (almostEqual(first.x, last.x) && almostEqual(first.y, last.y)) {
    return verts.slice(0, -1);
  }
  return verts;
}

type ParsedPolyline = { verts: PieceVertex[]; layer: string | null };

function readLayer(block: DxfPair[]): string | null {
  for (const { code, value } of block) {
    if (code === 8) return value || null;
  }
  return null;
}

function parseLwPolyline(block: DxfPair[], scale: number): ParsedPolyline | null {
  let closed = false;
  const verts: PieceVertex[] = [];
  let pendingX: number | null = null;
  const layer = readLayer(block);

  for (const { code, value } of block) {
    if (code === 70) {
      const flags = Number(value);
      if (Number.isFinite(flags) && (flags & 1) === 1) closed = true;
    } else if (code === 10) {
      const x = Number(value);
      pendingX = Number.isFinite(x) ? x : null;
    } else if (code === 20 && pendingX !== null) {
      const y = Number(value);
      if (Number.isFinite(y)) {
        verts.push({ x: pendingX * scale, y: y * scale });
      }
      pendingX = null;
    }
  }

  if (!closed && verts.length >= 3) {
    const first = verts[0]!;
    const last = verts[verts.length - 1]!;
    if (almostEqual(first.x, last.x, 0.01) && almostEqual(first.y, last.y, 0.01)) {
      closed = true;
    }
  }

  if (!closed || verts.length < 3) return null;
  return { verts: closeIfNeeded(verts), layer };
}

function parsePolyline(block: DxfPair[], scale: number, allBlocks: DxfPair[][], index: number): ParsedPolyline | null {
  let closed = false;
  const layer = readLayer(block);
  for (const { code, value } of block) {
    if (code === 70) {
      const flags = Number(value);
      if (Number.isFinite(flags) && (flags & 1) === 1) closed = true;
    }
  }

  const verts: PieceVertex[] = [];
  for (let i = index + 1; i < allBlocks.length; i++) {
    const next = allBlocks[i]!;
    const type = entityType(next);
    if (type === "SEQEND") break;
    if (type !== "VERTEX") continue;
    let x: number | null = null;
    let y: number | null = null;
    for (const { code, value } of next) {
      if (code === 10) {
        const n = Number(value);
        x = Number.isFinite(n) ? n : null;
      } else if (code === 20) {
        const n = Number(value);
        y = Number.isFinite(n) ? n : null;
      }
    }
    if (x !== null && y !== null) {
      verts.push({ x: x * scale, y: y * scale });
    }
  }

  if (!closed && verts.length >= 3) {
    const first = verts[0]!;
    const last = verts[verts.length - 1]!;
    if (almostEqual(first.x, last.x, 0.01) && almostEqual(first.y, last.y, 0.01)) {
      closed = true;
    }
  }

  if (!closed || verts.length < 3) return null;
  return { verts: closeIfNeeded(verts), layer };
}

function decodeMtext(raw: string): string {
  return raw
    .replace(/\\P/gi, " ")
    .replace(/\{\\[^;]*;/g, "")
    .replace(/\}/g, "")
    .replace(/\\[A-Za-z][^;]*;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTextLabel(block: DxfPair[]): TextLabel | null {
  const type = entityType(block);
  let x: number | null = null;
  let y: number | null = null;
  let text = "";

  for (const { code, value } of block) {
    if (code === 10) {
      const n = Number(value);
      if (Number.isFinite(n)) x = n;
    } else if (code === 20) {
      const n = Number(value);
      if (Number.isFinite(n)) y = n;
    } else if (code === 1 || code === 3) {
      text = type === "MTEXT" ? decodeMtext(value) : value.trim();
    }
  }

  if (x === null || y === null || !text) return null;
  // Skip pure numbers / dimensions.
  if (/^[\d./\s×xX"'-]+$/.test(text)) return null;
  if (text.length > 60) text = text.slice(0, 60);
  return { text, x, y };
}

function centroid(vertices: PieceVertex[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const v of vertices) {
    x += v.x;
    y += v.y;
  }
  return { x: x / vertices.length, y: y / vertices.length };
}

function assignLabel(
  vertices: PieceVertex[],
  labels: TextLabel[],
  used: Set<number>,
  scale: number,
): string | null {
  const aabb = polygonAabb(vertices);
  if (!aabb) return null;
  const c = centroid(vertices);
  const pad = LABEL_SEARCH_PAD_IN;

  let bestIdx = -1;
  let bestDist = Infinity;

  for (let i = 0; i < labels.length; i++) {
    if (used.has(i)) continue;
    const label = labels[i]!;
    const lx = label.x * scale;
    const ly = label.y * scale;
    const inside =
      lx >= aabb.minX - pad &&
      lx <= aabb.maxX + pad &&
      ly >= aabb.minY - pad &&
      ly <= aabb.maxY + pad;
    if (!inside) continue;
    const dist = (lx - c.x) ** 2 + (ly - c.y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) return null;
  used.add(bestIdx);
  return labels[bestIdx]!.text;
}

function isUsableShape(vertices: PieceVertex[], layer: string | null): boolean {
  if (isAnnotationLayer(layer)) return false;
  const aabb = polygonAabb(vertices);
  if (!aabb) return false;
  if (aabb.widthIn < MIN_EDGE_IN || aabb.heightIn < MIN_EDGE_IN) return false;
  if (aabb.widthIn > MAX_DIM_IN || aabb.heightIn > MAX_DIM_IN) return false;
  if (polygonAreaSqIn(vertices) < MIN_AREA_SQ_IN) return false;
  const longEdge = Math.max(aabb.widthIn, aabb.heightIn);
  const shortEdge = Math.max(Math.min(aabb.widthIn, aabb.heightIn), 1e-6);
  if (longEdge / shortEdge > MAX_ASPECT_RATIO) return false;
  return true;
}

/**
 * Parse an ASCII DXF drawing into SmartFinder pieces.
 * One closed outline → one piece (L-shapes stay a single polygon).
 */
export function parseDxfPieces(text: string): DxfParseResult {
  if (!text || !text.includes("ENTITIES")) {
    return { pieces: [], unitsDetected: "unknown" };
  }

  const pairs = parsePairs(text);
  const insunits = readInsUnits(pairs);
  const { factor, label: unitsDetected } = unitsToInches(insunits);
  const blocks = entityBlocks(pairs);

  const labels: TextLabel[] = [];
  const polygons: PieceVertex[][] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const type = entityType(block);

    if (type === "TEXT" || type === "MTEXT") {
      const label = parseTextLabel(block);
      if (label) labels.push(label);
      continue;
    }

    if (type === "LWPOLYLINE") {
      const parsed = parseLwPolyline(block, factor);
      if (parsed && isUsableShape(parsed.verts, parsed.layer)) {
        polygons.push(parsed.verts);
      }
      continue;
    }

    if (type === "POLYLINE") {
      const parsed = parsePolyline(block, factor, blocks, i);
      if (parsed && isUsableShape(parsed.verts, parsed.layer)) {
        polygons.push(parsed.verts);
      }
    }
  }

  // Prefer larger shapes (actual stone outlines) over tiny trim boxes.
  polygons.sort(
    (a, b) => polygonAreaSqIn(b) - polygonAreaSqIn(a),
  );

  const usedLabels = new Set<number>();
  const pieces: Piece[] = [];

  for (const vertices of polygons) {
    if (pieces.length >= MAX_PIECES) break;
    const aabb = polygonAabb(vertices);
    if (!aabb) continue;

    const fromDxf = assignLabel(vertices, labels, usedLabels, factor);
    const pieceLabel = fromDxf?.trim() || `Piece ${pieces.length + 1}`;

    pieces.push({
      label: pieceLabel.slice(0, 60),
      widthIn: Math.round(aabb.widthIn * 100) / 100,
      heightIn: Math.round(aabb.heightIn * 100) / 100,
      vertices: vertices.map((v) => ({
        x: Math.round(v.x * 1000) / 1000,
        y: Math.round(v.y * 1000) / 1000,
      })),
    });
  }

  return { pieces, unitsDetected };
}
