import { describe, expect, it } from "vitest";

import { nestPolygonPieces } from "./polygon-nest";
import { nestPiecesOnSlab } from "./nest";
import type { Piece } from "./types";

/**
 * L-shape: 20x20 outer with a 10x10 notch removed from the top-right.
 * AABB is 20x20 (400 sq in) but real area is 300 sq in.
 * Vertices: (0,0)-(20,0)-(20,10)-(10,10)-(10,20)-(0,20)
 */
function lPiece(label: string): Piece {
  return {
    label,
    widthIn: 20,
    heightIn: 20,
    vertices: [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ],
  };
}

describe("nestPolygonPieces", () => {
  it("interlocks two L-shapes that don't fit as bounding boxes", () => {
    // Two 20x20 AABB L-pieces = 800 sq in of bbox, but only 600 sq in of stone.
    // A 30x20 slab (600 sq in) cannot hold two 20x20 rectangles, yet the two
    // L-shapes interlock into a 30x20 area (300 + 300 = 600).
    const slabW = 30;
    const slabH = 20;
    const result = nestPolygonPieces(slabW, slabH, [lPiece("A"), lPiece("B")]);

    expect(result.placed).toBe(true);
    expect(result.unplaced).toHaveLength(0);
    expect(result.placements).toHaveLength(2);
    // Placements carry a real polygon outline for rendering.
    expect(result.placements[0]!.points!.length).toBeGreaterThanOrEqual(6);
  });

  it("leaves a piece unplaced when it truly cannot fit", () => {
    // One L needs at least 20 in in one dimension; a 15x15 slab can't hold it.
    const result = nestPolygonPieces(15, 15, [lPiece("A")]);
    expect(result.placed).toBe(false);
    expect(result.unplaced).toHaveLength(1);
    expect(result.oversized).toContain("A");
  });

  it("places a single L that fits within the slab", () => {
    const result = nestPolygonPieces(24, 24, [lPiece("A")]);
    expect(result.placed).toBe(true);
    expect(result.placements).toHaveLength(1);
  });
});

describe("nestPiecesOnSlab delegation", () => {
  it("uses polygon nesting when any piece has vertices", () => {
    const result = nestPiecesOnSlab(30, 20, [lPiece("A"), lPiece("B")]);
    expect(result.placed).toBe(true);
    expect(result.placements.every((p) => p.points)).toBe(true);
  });

  it("keeps shelf packing for plain rectangles (no points)", () => {
    const rects: Piece[] = [
      { label: "R1", widthIn: 20, heightIn: 10 },
      { label: "R2", widthIn: 20, heightIn: 10 },
    ];
    const result = nestPiecesOnSlab(20, 20, rects);
    expect(result.placed).toBe(true);
    expect(result.placements.every((p) => p.points === undefined)).toBe(true);
  });
});
