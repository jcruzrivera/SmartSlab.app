import { pointInPolygon, polygonAabb } from "@/lib/nesting/geometry";
import type { Point } from "@/lib/nesting/types";

/**
 * Grid budget tuned so any realistic slab (up to ~140"x80") rasterizes at
 * the full MIN_CELL_IN=0.25in resolution: 140*80 / 0.25^2 = 179,200 cells,
 * a 179KB Uint8Array — cheap regardless (mask AND runs in microseconds).
 * The area-based formula in computeCellSizeIn only coarsens the grid as a
 * safety valve for absurd inputs (e.g. a 1000"x1000" slab) — it must never
 * be what silently degrades resolution on a normal slab, since a coarser
 * cell quantizes the margin and produces false gaps/overlaps.
 */
export const MAX_GRID_CELLS = 200_000;
export const MIN_CELL_IN = 0.25;

/** Origin convention for every grid in this module: (0,0) is the bottom-left
 * of the slab, x increases right, y increases up. Row 0 = smallest y
 * (bottom row), col 0 = smallest x (left column). */
export function computeCellSizeIn(widthIn: number, heightIn: number): number {
  const cellByArea = Math.sqrt((widthIn * heightIn) / MAX_GRID_CELLS);
  return Math.max(MIN_CELL_IN, cellByArea);
}

export function createOccupancyGrid(
  widthIn: number,
  heightIn: number,
  cellIn: number,
): { grid: Uint8Array; cols: number; rows: number } {
  const cols = Math.max(1, Math.ceil(widthIn / cellIn));
  const rows = Math.max(1, Math.ceil(heightIn / cellIn));
  return { grid: new Uint8Array(cols * rows), cols, rows };
}

export type Mask = {
  cols: number;
  rows: number;
  /** Local occupied cell offsets [dr, dc] within the mask's own bbox. */
  offsets: Array<[number, number]>;
};

/** Rasterize a polygon (any position) into a Mask sized to its own bbox. */
export function rasterizePolygon(polygon: Point[], cellIn: number): Mask {
  const aabb = polygonAabb(polygon);
  if (!aabb) return { cols: 1, rows: 1, offsets: [[0, 0]] };

  const cols = Math.max(1, Math.round(aabb.widthIn / cellIn));
  const rows = Math.max(1, Math.round(aabb.heightIn / cellIn));
  const offsets: Array<[number, number]> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = aabb.minX + (c + 0.5) * cellIn;
      const cy = aabb.minY + (r + 0.5) * cellIn;
      if (pointInPolygon(cx, cy, polygon)) offsets.push([r, c]);
    }
  }

  // Degenerate slivers may miss every cell center; keep at least one cell.
  if (offsets.length === 0) offsets.push([0, 0]);
  return { cols, rows, offsets };
}

export function markOccupied(
  grid: Uint8Array,
  gridCols: number,
  mask: Mask,
  r0: number,
  c0: number,
): void {
  for (const [dr, dc] of mask.offsets) {
    grid[(r0 + dr) * gridCols + (c0 + dc)] = 1;
  }
}

/** Marks a border strip (converted from inches to whole cells, rounded up)
 * as occupied around all four slab edges — the slab-edge margin buffer. */
export function markBorderOccupied(
  grid: Uint8Array,
  gridCols: number,
  gridRows: number,
  cellIn: number,
  borderIn: number,
): void {
  if (borderIn <= 0) return;
  const borderCells = Math.ceil(borderIn / cellIn);
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (
        r < borderCells ||
        r >= gridRows - borderCells ||
        c < borderCells ||
        c >= gridCols - borderCells
      ) {
        grid[r * gridCols + c] = 1;
      }
    }
  }
}

/** Bottom-left-fill: scans rows ascending from 0 (bottom first), then
 * columns ascending from 0 (left first) within each row band. */
export function findBottomLeftFit(
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

export type PlacedMask = { mask: Mask; r0: number; c0: number };

function fitsAt(
  grid: Uint8Array,
  gridCols: number,
  gridRows: number,
  mask: Mask,
  r0: number,
  c0: number,
): boolean {
  if (r0 < 0 || c0 < 0 || r0 + mask.rows > gridRows || c0 + mask.cols > gridCols) {
    return false;
  }
  for (const [dr, dc] of mask.offsets) {
    if (grid[(r0 + dr) * gridCols + (c0 + dc)] === 1) return false;
  }
  return true;
}

/**
 * Local greedy compaction: for each already-placed mask (in placement
 * order), slide it down then left one cell at a time while collision-free
 * against the others, mutating `placed[i].r0`/`c0` and the grid in place.
 * Not a global re-optimizer — a single post-pass per the spec's step 6.
 *
 * Must be called with the same inflated masks used at placement time, not
 * fresh rasterizations of the raw piece polygons — otherwise compaction can
 * slide a piece close enough to violate the margin that placement respected.
 */
export function compact(
  grid: Uint8Array,
  gridCols: number,
  gridRows: number,
  placed: PlacedMask[],
): void {
  for (const p of placed) {
    // Unmark self so it doesn't collide with itself while probing.
    for (const [dr, dc] of p.mask.offsets) {
      grid[(p.r0 + dr) * gridCols + (p.c0 + dc)] = 0;
    }

    while (fitsAt(grid, gridCols, gridRows, p.mask, p.r0 - 1, p.c0)) {
      p.r0 -= 1;
    }
    while (fitsAt(grid, gridCols, gridRows, p.mask, p.r0, p.c0 - 1)) {
      p.c0 -= 1;
    }

    for (const [dr, dc] of p.mask.offsets) {
      grid[(p.r0 + dr) * gridCols + (p.c0 + dc)] = 1;
    }
  }
}
