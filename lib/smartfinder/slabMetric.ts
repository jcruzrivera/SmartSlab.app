import { CUTTING_YIELD_FACTOR } from "@/lib/config/nesting";

export type FitStatus = "fits" | "partial" | "insufficient";

export type SlabMetric = {
  status: FitStatus;
  label: "Waste" | "Shortfall";
  value: string; // "2.3%" or "3.4 sq ft"
  tone: "good" | "warn" | "bad";
};

export function getSlabMetric(
  slabAreaSqft: number,
  neededAreaSqft: number,
  allPiecesPlaced: boolean,
  yieldFactor: number = CUTTING_YIELD_FACTOR,
): SlabMetric {
  const effectiveArea = slabAreaSqft * yieldFactor;

  // All pieces nest and effective area covers need → true Waste
  if (allPiecesPlaced && effectiveArea >= neededAreaSqft) {
    const waste =
      slabAreaSqft > 0
        ? ((slabAreaSqft - neededAreaSqft) / slabAreaSqft) * 100
        : 100;
    return {
      status: "fits",
      label: "Waste",
      value: `${waste.toFixed(1)}%`,
      tone: waste <= 25 ? "good" : "warn",
    };
  }

  // Not enough usable material → Shortfall
  const shortfall = Math.max(0, neededAreaSqft - effectiveArea);
  return {
    status: allPiecesPlaced ? "partial" : "insufficient",
    label: "Shortfall",
    value: `${shortfall.toFixed(1)} sq ft`,
    tone: "bad",
  };
}
