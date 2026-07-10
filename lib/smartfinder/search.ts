import type { DbUser } from "@/lib/db/users";
import { listPublicSlabs, listSlabsByVendor } from "@/lib/db/slabs";
import { consumeSmartfinderSearch } from "@/lib/plan/enforce";
import { effectivePlan } from "@/lib/plan/limits";
import { rankSlabs } from "@/lib/smartfinder/fit";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { toSmartFinderResult } from "@/lib/smartfinder/serialize";

const FREE_TIER_RESULT_CAP = 3;

export type SmartfinderSearchPayload = {
  results: SmartFinderResult[];
  ownResults: SmartFinderResult[];
  marketResults: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
};

function validatePieces(raw: unknown): Piece[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;

  const pieces: Piece[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { label, widthIn, heightIn } = item as Record<string, unknown>;
    if (typeof label !== "string" || !label.trim()) return null;
    if (typeof widthIn !== "number" || widthIn <= 0 || widthIn > 600) return null;
    if (typeof heightIn !== "number" || heightIn <= 0 || heightIn > 600) return null;
    pieces.push({
      label: label.trim(),
      widthIn: Math.round(widthIn * 100) / 100,
      heightIn: Math.round(heightIn * 100) / 100,
    });
  }

  return pieces;
}

function emptyPayload(): SmartfinderSearchPayload {
  return {
    results: [],
    ownResults: [],
    marketResults: [],
    totalMatches: 0,
    limited: false,
  };
}

export async function runSmartfinderSearch(
  user: DbUser,
  rawPieces: unknown,
): Promise<SmartfinderSearchPayload> {
  const pieces = validatePieces(rawPieces);
  if (!pieces) {
    return emptyPayload();
  }

  await consumeSmartfinderSearch(user);

  const [ownSlabs, publicSlabs] = await Promise.all([
    listSlabsByVendor(user.id),
    listPublicSlabs({ limit: 200 }),
  ]);

  const ownAvailable = ownSlabs.filter((slab) => slab.status === "available");
  const marketSlabs = publicSlabs.filter((slab) => slab.vendorId !== user.id);

  const ownRanked = rankSlabs(ownAvailable, pieces).map((result) =>
    toSmartFinderResult(result, { isOwnListing: true }),
  );
  const marketRanked = rankSlabs(marketSlabs, pieces).map((result) =>
    toSmartFinderResult(result, { isOwnListing: false }),
  );

  const combined = [...ownRanked, ...marketRanked];
  const totalMatches = combined.length;

  const plan = effectivePlan(user.plan, user.planStatus);
  const isPaid = plan === "pro" || plan === "premium";
  const limited = !isPaid && totalMatches > FREE_TIER_RESULT_CAP;

  let ownResults = ownRanked;
  let marketResults = marketRanked;
  let results = combined;

  if (!isPaid) {
    // Cap after prioritizing own inventory so vendors see their slabs first.
    const capped: SmartFinderResult[] = [];
    for (const item of combined) {
      if (capped.length >= FREE_TIER_RESULT_CAP) break;
      capped.push(item);
    }
    results = capped;
    ownResults = capped.filter((item) => item.isOwnListing);
    marketResults = capped.filter((item) => !item.isOwnListing);
  }

  return {
    results,
    ownResults,
    marketResults,
    totalMatches,
    limited,
  };
}
