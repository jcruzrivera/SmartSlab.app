import { describe, expect, it } from "vitest";

import { polygonAabb } from "./geometry";
import { packSlab } from "./pack-slab";
import type { NestPiece, SlabSource } from "./types";

function rectPiece(id: string, w: number, h: number, veinLocked = true): NestPiece {
  return {
    id,
    label: id,
    veinLocked,
    polygon: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  };
}

describe("packSlab margin correctness", () => {
  it("keeps a single piece exactly marginIn away from the slab edge, not 1.5x", () => {
    const slab: SlabSource = { kind: "virtual", widthIn: 60, heightIn: 40 };
    const marginIn = 2;
    const { placements, leftover } = packSlab([rectPiece("A", 10, 10)], slab, marginIn);

    expect(leftover).toHaveLength(0);
    const aabb = polygonAabb(placements[0]!.polygon)!;
    // Bottom-left-fill should land the piece at exactly marginIn from the
    // bottom-left slab edges — not marginIn + marginIn/2.
    expect(aabb.minX).toBeCloseTo(marginIn, 1);
    expect(aabb.minY).toBeCloseTo(marginIn, 1);
  });

  it("keeps two pieces exactly marginIn apart from each other", () => {
    const slab: SlabSource = { kind: "virtual", widthIn: 60, heightIn: 40 };
    const marginIn = 2;
    const { placements, leftover } = packSlab(
      [rectPiece("A", 10, 10), rectPiece("B", 10, 10)],
      slab,
      marginIn,
    );
    expect(leftover).toHaveLength(0);
    const [a, b] = placements.map((p) => polygonAabb(p.polygon)!);
    // Two 10x10 squares placed bottom-left-fill with a 2in slab margin land
    // side by side on the bottom row; the gap between them should be
    // exactly marginIn.
    const sorted = [a!, b!].sort((x, y) => x.minX - y.minX);
    const gap = sorted[1]!.minX - sorted[0]!.maxX;
    expect(gap).toBeCloseTo(marginIn, 1);
  });
});

describe("packSlab vein lock", () => {
  it("never rotates a vein-locked piece 90 or 270", () => {
    const slab: SlabSource = { kind: "virtual", widthIn: 60, heightIn: 60 };
    const pieces = [
      rectPiece("A", 55, 8, true),
      rectPiece("B", 55, 8, true),
      rectPiece("C", 55, 8, true),
    ];
    const { placements, leftover } = packSlab(pieces, slab, 1);
    expect(leftover).toHaveLength(0);
    expect(placements).toHaveLength(3);
    for (const p of placements) {
      expect([0, 180]).toContain(p.rotation);
    }
  });

  it("a piece that only fits rotated 90 is unplaced when vein-locked but placed when unlocked", () => {
    // 25x5 doesn't fit a 20-wide slab at 0/180 (needs width 25 > 20), but
    // rotated 90/270 it's 5x25, which fits easily.
    const slab: SlabSource = { kind: "virtual", widthIn: 20, heightIn: 60 };

    const locked = packSlab([rectPiece("A", 25, 5, true)], slab, 1);
    expect(locked.leftover).toHaveLength(1);
    expect(locked.placements).toHaveLength(0);

    const unlocked = packSlab([rectPiece("A", 25, 5, false)], slab, 1);
    expect(unlocked.leftover).toHaveLength(0);
    expect([90, 270]).toContain(unlocked.placements[0]!.rotation);
  });
});
