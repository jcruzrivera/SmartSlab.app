import { describe, expect, it } from "vitest";

import {
  MIN_CELL_IN,
  compact,
  computeCellSizeIn,
  createOccupancyGrid,
  findBottomLeftFit,
  markBorderOccupied,
  markOccupied,
  rasterizePolygon,
  type Mask,
} from "./raster";

describe("computeCellSizeIn", () => {
  it("stays at the full 0.25in resolution for any realistic slab size", () => {
    expect(computeCellSizeIn(126, 63)).toBeCloseTo(MIN_CELL_IN, 5);
    expect(computeCellSizeIn(140, 80)).toBeCloseTo(MIN_CELL_IN, 5);
  });

  it("only coarsens as a safety valve for absurd slab sizes", () => {
    expect(computeCellSizeIn(1000, 1000)).toBeGreaterThan(MIN_CELL_IN);
  });
});

describe("rasterizePolygon", () => {
  it("rasterizes a rectangle to a fully-occupied mask matching its own bbox", () => {
    const cell = 1;
    const mask = rasterizePolygon(
      [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 2 },
        { x: 0, y: 2 },
      ],
      cell,
    );
    expect(mask.cols).toBe(4);
    expect(mask.rows).toBe(2);
    expect(mask.offsets).toHaveLength(8);
  });
});

describe("findBottomLeftFit", () => {
  it("scans bottom row first, then left-to-right within a row", () => {
    const cols = 10;
    const rows = 10;
    const grid = new Uint8Array(cols * rows);
    // Occupy the entire bottom-left 3x3 block so the fit must skip past it.
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) grid[r * cols + c] = 1;
    }
    const mask: Mask = {
      cols: 2,
      rows: 2,
      offsets: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    };
    const pos = findBottomLeftFit(grid, cols, rows, mask);
    // Bottom row (r=0..2 occupied), so the first free 2x2 spot at row 0 is
    // columns 3-4; bottom-left-fill must not jump up to row 3 first.
    expect(pos).toEqual({ r0: 0, c0: 3 });
  });
});

describe("markBorderOccupied", () => {
  it("marks a border strip sized from inches, not left as a full-margin double-count", () => {
    const cellIn = 0.25;
    const { grid, cols, rows } = createOccupancyGrid(10, 10, cellIn);
    markBorderOccupied(grid, cols, rows, cellIn, 0.75); // marginIn/2 for a 1.5in margin
    const borderCells = Math.ceil(0.75 / cellIn); // 3 cells
    expect(grid[0]).toBe(1); // corner
    expect(grid[borderCells * cols + borderCells]).toBe(0); // just inside the border
  });
});

describe("compact", () => {
  it("slides a placed mask down and left toward the origin when space is free", () => {
    const cols = 10;
    const rows = 10;
    const grid = new Uint8Array(cols * rows);
    const mask: Mask = {
      cols: 2,
      rows: 2,
      offsets: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    };
    const placed = [{ mask, r0: 5, c0: 5 }];
    markOccupied(grid, cols, mask, 5, 5);

    compact(grid, cols, rows, placed);

    expect(placed[0]!.r0).toBe(0);
    expect(placed[0]!.c0).toBe(0);
  });
});
