import { describe, expect, it } from "vitest";

import { inflatePolygon, polygonAreaSqIn, rotateQuarter } from "./geometry";
import type { Point } from "./types";

describe("inflatePolygon", () => {
  it("inflates a rectangle outward by exactly the given amount on every side", () => {
    const rect: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const inflated = inflatePolygon(rect, 1);
    expect(inflated).toEqual([
      { x: -1, y: -1 },
      { x: 11, y: -1 },
      { x: 11, y: 11 },
      { x: -1, y: 11 },
    ]);
  });

  it("shrinks the concave notch of an L-shape (reflex corner moves into the pocket)", () => {
    // 20x20 outer, 10x10 notch removed top-right — same as the lPiece
    // fixture used across lib/smartfinder and lib/nesting tests.
    const l: Point[] = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ];
    const inflated = inflatePolygon(l, 1);
    // The reflex vertex at (10,10) should move diagonally into the notch.
    expect(inflated[3]).toEqual({ x: 11, y: 11 });
    // Inflating outward must not shrink the overall outer footprint.
    expect(inflated[0]).toEqual({ x: -1, y: -1 });
    expect(inflated[1]).toEqual({ x: 21, y: -1 });
  });

  it("increases total area for a convex shape and decreases the notch area (net area still grows)", () => {
    const l: Point[] = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ];
    const before = polygonAreaSqIn(l);
    const after = polygonAreaSqIn(inflatePolygon(l, 1));
    expect(after).toBeGreaterThan(before);
  });
});

describe("rotateQuarter", () => {
  it("keeps a paired (inflated, original) polygon in the same coordinate frame after rotation", () => {
    const original: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 2 },
      { x: 0, y: 2 },
    ];
    const inflated = inflatePolygon(original, 1);

    const rotatedOriginal = rotateQuarter(original, 1);
    const rotatedInflated = rotateQuarter(inflated, 1);

    // Every original vertex should still sit exactly `amount` inside its
    // corresponding inflated vertex along both axes after rotation.
    for (let i = 0; i < original.length; i++) {
      const o = rotatedOriginal[i]!;
      const inf = rotatedInflated[i]!;
      expect(Math.abs(o.x - inf.x)).toBeCloseTo(1, 5);
      expect(Math.abs(o.y - inf.y)).toBeCloseTo(1, 5);
    }
  });
});
