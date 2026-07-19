import { describe, expect, it } from "vitest";

import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";
import { pointInPolygon, polygonAabb } from "@/lib/smartfinder/geometry";
import {
  clampCutoutOffset,
  isRect,
  isRectilinear,
  resizeEdge,
  rotatePieceWithCutouts,
  snapQuarter,
} from "./piece-geometry";

function rect(w: number, h: number): SfPolygon {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

/** L: 113.5 main run x 25.25 deep, return leg 36 wide extending to 61.25 deep.
 * Vertices: (0,0)(113.5,0)(113.5,25.25)(36,25.25)(36,61.25)(0,61.25) */
function lShape(): SfPolygon {
  return [
    { x: 0, y: 0 },
    { x: 113.5, y: 0 },
    { x: 113.5, y: 25.25 },
    { x: 36, y: 25.25 },
    { x: 36, y: 61.25 },
    { x: 0, y: 61.25 },
  ];
}

describe("predicates", () => {
  it("classifies rects and rectilinear polygons", () => {
    expect(isRect(rect(10, 5))).toBe(true);
    expect(isRect(lShape())).toBe(false);
    expect(isRectilinear(lShape())).toBe(true);
    expect(
      isRectilinear([
        { x: 0, y: 0 },
        { x: 10, y: 5 },
        { x: 0, y: 10 },
      ]),
    ).toBe(false);
  });

  it("snapQuarter snaps to 0.25", () => {
    expect(snapQuarter(10.13)).toBe(10.25);
    expect(snapQuarter(10.12)).toBe(10);
  });
});

describe("resizeEdge on rects", () => {
  it("resizes width via a horizontal edge, anchored at min corner", () => {
    const out = resizeEdge(rect(72, 25.25), 0, 85.5)!;
    const aabb = polygonAabb(out)!;
    expect(aabb.widthIn).toBeCloseTo(85.5, 5);
    expect(aabb.heightIn).toBeCloseTo(25.25, 5);
    expect(aabb.minX).toBe(0);
    expect(aabb.minY).toBe(0);
  });

  it("resizes height via a vertical edge", () => {
    const out = resizeEdge(rect(72, 25.25), 1, 30)!;
    const aabb = polygonAabb(out)!;
    expect(aabb.widthIn).toBeCloseTo(72, 5);
    expect(aabb.heightIn).toBeCloseTo(30, 5);
  });
});

describe("resizeEdge on the L-shape", () => {
  it("stretches the main run (edge 0) moving v1 and v2 only", () => {
    const out = resizeEdge(lShape(), 0, 120)!;
    expect(out[1]).toEqual({ x: 120, y: 0 });
    expect(out[2]).toEqual({ x: 120, y: 25.25 });
    expect(out[3]).toEqual({ x: 36, y: 25.25 }); // untouched
    expect(out[0]).toEqual({ x: 0, y: 0 });
  });

  it("resizes the right depth (edge 1) moving v2 and v3", () => {
    const out = resizeEdge(lShape(), 1, 30)!;
    expect(out[2]).toEqual({ x: 113.5, y: 30 });
    expect(out[3]).toEqual({ x: 36, y: 30 });
    expect(out[4]).toEqual({ x: 36, y: 61.25 });
  });

  it("resizes the leg top width (edge 4) moving v5 and v0", () => {
    // Edge 4 is v4→v5 = (36,61.25)→(0,61.25), horizontal, dir (-1,0).
    const out = resizeEdge(lShape(), 4, 40)!;
    // delta = 4 → v5 and v0 move by (-4, 0).
    expect(out[5]).toEqual({ x: -4, y: 61.25 });
    expect(out[0]).toEqual({ x: -4, y: 0 });
  });

  it("rejects a resize that would collapse an edge", () => {
    // Shrinking the main run (edge 0) to exactly the notch x (36) collapses
    // edge 2 (from x=newLen back to x=36) to zero length → guard fires.
    expect(resizeEdge(lShape(), 0, 36)).toBeNull();
  });

  it("rejects non-rectilinear polygons", () => {
    const tri: SfPolygon = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 10 },
    ];
    expect(resizeEdge(tri, 0, 20)).toBeNull();
  });
});

describe("rotatePieceWithCutouts", () => {
  it("rotating a rect 4 times returns the identity", () => {
    let piece = { polygon: rect(72, 25.25), cutouts: [] as SfCutout[] };
    for (let k = 0; k < 4; k++) piece = rotatePieceWithCutouts(piece);
    const aabb = polygonAabb(piece.polygon)!;
    expect(aabb.widthIn).toBeCloseTo(72, 5);
    expect(aabb.heightIn).toBeCloseTo(25.25, 5);
  });

  it("keeps a sink cutout inside the piece after rotation", () => {
    const sink: SfCutout = {
      type: "sink",
      polygon: rect(33, 22),
      offsetX: 20,
      offsetY: 1.5,
    };
    const rotated = rotatePieceWithCutouts({
      polygon: rect(72, 25.25),
      cutouts: [sink],
    });
    const pieceBb = polygonAabb(rotated.polygon)!;
    const c = rotated.cutouts[0]!;
    const cbb = polygonAabb(c.polygon)!;
    // Rotated sink bbox is 22x33; its placed corners stay inside the
    // rotated piece bbox (25.25 x 72).
    expect(c.offsetX).toBeGreaterThanOrEqual(pieceBb.minX - 1e-6);
    expect(c.offsetY).toBeGreaterThanOrEqual(pieceBb.minY - 1e-6);
    expect(c.offsetX + cbb.widthIn).toBeLessThanOrEqual(pieceBb.maxX + 1e-6);
    expect(c.offsetY + cbb.heightIn).toBeLessThanOrEqual(pieceBb.maxY + 1e-6);
    // Center should be inside the polygon, not just the bbox.
    expect(
      pointInPolygon(
        c.offsetX + cbb.widthIn / 2,
        c.offsetY + cbb.heightIn / 2,
        rotated.polygon,
      ),
    ).toBe(true);
  });
});

describe("clampCutoutOffset", () => {
  const sink: SfCutout = {
    type: "sink",
    polygon: rect(33, 22),
    offsetX: 0,
    offsetY: 0,
  };
  const piece = rect(72, 25.25);

  it("clamps at all four walls", () => {
    expect(clampCutoutOffset(piece, sink, -10, -10)).toEqual({
      offsetX: 0,
      offsetY: 0,
    });
    const far = clampCutoutOffset(piece, sink, 100, 100);
    expect(far.offsetX).toBeCloseTo(72 - 33, 5);
    expect(far.offsetY).toBeCloseTo(25.25 - 22, 5);
  });

  it("passes through positions already inside", () => {
    expect(clampCutoutOffset(piece, sink, 10, 1.5)).toEqual({
      offsetX: 10,
      offsetY: 1.5,
    });
  });
});
