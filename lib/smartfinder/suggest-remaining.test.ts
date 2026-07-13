import { describe, expect, it } from "vitest";

import { nestPiecesOnSlab } from "./nest";
import { suggestSlabsForRemaining } from "./suggest-remaining";
import type { Piece, SmartFinderResult } from "./types";

const kitchen: Piece = { label: "Kitchen counter", widthIn: 96, heightIn: 26 };
const bar: Piece = { label: "Bar", widthIn: 36, heightIn: 16 };
const small: Piece = { label: "Splash", widthIn: 24, heightIn: 6 };

function fakeResult(
  id: string,
  w: number,
  h: number,
  own: boolean,
): SmartFinderResult {
  return {
    slabId: id,
    slabName: `Slab ${id}`,
    materialName: "Quartz",
    colorFamily: null,
    vendorCompany: null,
    vendorId: own ? "me" : "other",
    isOwnListing: own,
    status: "available",
    imageUrl: null,
    price: "1000",
    pricePerSqft: null,
    type: "full_slab",
    widthIn: String(w),
    heightIn: String(h),
    city: null,
    state: null,
    fitScore: 80,
    totalPieceSqft: 10,
    slabSqft: (w * h) / 144,
    wastePercent: 10,
    fits: true,
    oversizedPieces: [],
    pricePerUsableSqft: null,
    isNegotiable: false,
    quantity: 1,
  };
}

describe("nestPiecesOnSlab unplaced", () => {
  it("returns unplaced Piece objects for oversized leftovers", () => {
    // Tiny slab: bar + splash fit, kitchen does not.
    const nest = nestPiecesOnSlab(40, 20, [kitchen, bar, small]);
    expect(nest.placed).toBe(false);
    expect(nest.oversized).toContain("Kitchen counter");
    expect(nest.unplaced.map((p) => p.label)).toContain("Kitchen counter");
    expect(nest.unplaced.some((p) => p.widthIn === 96)).toBe(true);
  });
});

describe("suggestSlabsForRemaining", () => {
  it("prefers own inventory that fits remaining, then marketplace", () => {
    const remaining = [kitchen];
    const current = "current";
    const ownFit = fakeResult("own-big", 120, 60, true);
    const ownTooSmall = fakeResult("own-small", 30, 20, true);
    const marketFit = fakeResult("mkt-big", 110, 50, false);

    const { own, market } = suggestSlabsForRemaining({
      remaining,
      currentSlabId: current,
      ownResults: [ownTooSmall, ownFit],
      marketResults: [marketFit],
    });

    expect(own.map((r) => r.slabId)).toEqual(["own-big"]);
    expect(market.map((r) => r.slabId)).toEqual(["mkt-big"]);
  });

  it("excludes the current slab from suggestions", () => {
    const remaining = [bar];
    const current = fakeResult("current", 80, 40, true);
    const { own } = suggestSlabsForRemaining({
      remaining,
      currentSlabId: "current",
      ownResults: [current, fakeResult("other", 80, 40, true)],
    });
    expect(own.map((r) => r.slabId)).toEqual(["other"]);
  });
});
