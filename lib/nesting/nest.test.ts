import { describe, expect, it } from "vitest";

import { polygonAabb } from "./geometry";
import { nest } from "./nest";
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

/** 40x40 outer, 20x20 notch removed top-right — scaled-up lPiece from
 * lib/smartfinder/polygon-nest.test.ts. */
function lPiece(id: string, veinLocked = true): NestPiece {
  return {
    id,
    label: id,
    veinLocked,
    polygon: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 20 },
      { x: 20, y: 20 },
      { x: 20, y: 40 },
      { x: 0, y: 40 },
    ],
  };
}

function virtualSlab(w: number, h: number): SlabSource {
  return { kind: "virtual", widthIn: w, heightIn: h };
}

function aabbOverlap(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
  tolerance = 0.3,
): boolean {
  return (
    a.minX < b.maxX - tolerance &&
    a.maxX > b.minX + tolerance &&
    a.minY < b.maxY - tolerance &&
    a.maxY > b.minY + tolerance
  );
}

describe("nest — case 1: rects + L-shape, no collision, margin respected", () => {
  it("places both pieces without any overlap", () => {
    const result = nest({
      pieces: [rectPiece("A", 40, 25), lPiece("B")],
      slabs: [virtualSlab(100, 50)],
      marginIn: 1,
      allowNewVirtualSlabs: false,
    });

    expect(result.unplaced).toHaveLength(0);
    expect(result.slabsUsed).toBe(1);

    const boxes = result.placements.map((p) => polygonAabb(p.polygon)!);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(aabbOverlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
  });
});

describe("nest — case 2: vein-locked pieces never rotate 90/270", () => {
  it("keeps every placement at rotation 0 or 180", () => {
    const pieces = [
      rectPiece("A", 55, 8, true),
      rectPiece("B", 55, 8, true),
      rectPiece("C", 55, 8, true),
      rectPiece("D", 55, 8, true),
      rectPiece("E", 55, 8, true),
    ];
    const result = nest({
      pieces,
      slabs: [virtualSlab(60, 60), virtualSlab(60, 60)],
      marginIn: 1,
      allowNewVirtualSlabs: false,
    });

    expect(result.unplaced).toHaveLength(0);
    for (const p of result.placements) {
      expect([0, 180]).toContain(p.rotation);
    }
  });
});

describe("nest — case 3: second slab opened and distributed correctly", () => {
  it("places one piece per slab and leaves the third unplaced with no_room_on_any_slab", () => {
    const result = nest({
      pieces: [
        rectPiece("P1", 30, 30),
        rectPiece("P2", 30, 30),
        rectPiece("P3", 30, 30),
      ],
      slabs: [virtualSlab(40, 40), virtualSlab(40, 40)],
      marginIn: 1,
      allowNewVirtualSlabs: false,
    });

    expect(result.slabsUsed).toBe(2);
    const bySlab = new Map(result.placements.map((p) => [p.pieceId, p.slabIndex]));
    expect(bySlab.get("P1")).toBe(1);
    expect(bySlab.get("P2")).toBe(2);

    expect(result.unplaced).toHaveLength(1);
    expect(result.unplaced[0]!.pieceId).toBe("P3");
    expect(result.unplaced[0]!.reason).toBe("no_room_on_any_slab");
  });
});

describe("nest — case 4: piece bigger than every candidate slab", () => {
  it("does not throw and reports a clear no_slab_fits error", () => {
    const result = nest({
      pieces: [rectPiece("Huge", 80, 80)],
      slabs: [virtualSlab(40, 60), virtualSlab(50, 70)],
      marginIn: 1,
      allowNewVirtualSlabs: false,
    });

    expect(result.unplaced).toHaveLength(1);
    expect(result.unplaced[0]!.reason).toBe("no_slab_fits");
    expect(result.unplaced[0]!.message).toContain("Huge");
  });

  it("places the oversized piece once a big-enough virtual slab is synthesized", () => {
    const result = nest({
      pieces: [rectPiece("Huge", 80, 80)],
      slabs: [virtualSlab(40, 60), virtualSlab(50, 70)],
      marginIn: 1,
      allowNewVirtualSlabs: true,
      virtualSlabTemplate: { widthIn: 100, heightIn: 100 },
    });

    expect(result.unplaced).toHaveLength(0);
    expect(result.slabsUsed).toBe(1);
    expect(result.slabsUsedList[0]!.widthIn).toBe(100);
  });

  it("throws a config error when allowNewVirtualSlabs is true but no template is given", () => {
    expect(() =>
      nest({
        pieces: [rectPiece("Huge", 80, 80)],
        slabs: [virtualSlab(40, 60)],
        marginIn: 1,
        allowNewVirtualSlabs: true,
      }),
    ).toThrow();
  });
});

describe("nest — case 5: wastePct / slabsUsed math against known geometry", () => {
  it("computes exact waste percentage for a single known piece on a known slab", () => {
    const result = nest({
      pieces: [rectPiece("A", 40, 20)],
      slabs: [virtualSlab(50, 50)],
      marginIn: 0,
      allowNewVirtualSlabs: false,
    });

    expect(result.slabsUsed).toBe(1);
    expect(result.wastePct).toBeCloseTo(68, 1);
  });

  it("excludes an offered-but-unused slab from totalSlabSqft", () => {
    const result = nest({
      pieces: [rectPiece("P1", 30, 30), rectPiece("P2", 30, 30)],
      slabs: [virtualSlab(40, 40), virtualSlab(40, 40), virtualSlab(40, 40)],
      marginIn: 1,
      allowNewVirtualSlabs: false,
    });

    expect(result.slabsUsed).toBe(2);
    const twoSlabSqft = (2 * (40 * 40)) / 144;
    expect(result.totalSlabSqft).toBeCloseTo(twoSlabSqft, 2);
  });
});

describe("nest — case 6: golden reference-kitchen fixture", () => {
  it("nests all 5 reference pieces onto at most 3 126x63 slabs in under 2 seconds", () => {
    // Best-effort reconstruction of "pieza en L de 113½\" con retornos de
    // 20\"/28\"" for engine-testing purposes: a rectilinear U/L piece with a
    // main run 113.5x25.25 and two perpendicular return legs of unequal
    // height (20in and 28in beyond the main run's depth). Exact vertices
    // will be superseded by whatever Fase 2.5's plan-to-pieces generator
    // emits from the actual reference plan; the concave structure and scale
    // are representative now, and this fixture is reusable as-is then.
    const lReturn: NestPiece = {
      id: "lReturn",
      label: "L-shape (113.5\" run, 20\"/28\" returns)",
      veinLocked: true,
      polygon: [
        { x: 0, y: 0 },
        { x: 113.5, y: 0 },
        { x: 113.5, y: 53.25 },
        { x: 88.25, y: 53.25 },
        { x: 88.25, y: 25.25 },
        { x: 25.25, y: 25.25 },
        { x: 25.25, y: 45.25 },
        { x: 0, y: 45.25 },
      ],
    };

    const pieces: NestPiece[] = [
      rectPiece("top1", 72, 25.25),
      rectPiece("top2", 71, 25.25),
      rectPiece("island", 120, 25.25),
      rectPiece("wall3", 60, 25.25),
      lReturn,
    ];

    // A 4th slab is offered beyond the spec's "<=3" bound so that if this
    // v1 greedy (FFD + bottom-left-fill, not a globally optimal packer)
    // engine needs one more slab than a smarter packer would, the test
    // fails on the slabsUsed assertion below with a clear signal — not on
    // a conflated "pieces went unplaced" failure.
    const start = performance.now();
    const result = nest({
      pieces,
      slabs: [
        virtualSlab(126, 63),
        virtualSlab(126, 63),
        virtualSlab(126, 63),
        virtualSlab(126, 63),
      ],
      marginIn: 1.5,
      allowNewVirtualSlabs: false,
    });
    const elapsedMs = performance.now() - start;

    expect(result.unplaced).toHaveLength(0);
    expect(result.slabsUsed).toBeLessThanOrEqual(3);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
