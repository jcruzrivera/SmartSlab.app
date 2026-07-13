import type { DbUser } from "@/lib/db/users";
import { listPublicSlabs, listSlabsByVendor } from "@/lib/db/slabs";
import { consumeSmartfinderSearch } from "@/lib/plan/enforce";
import { effectivePlanForUser } from "@/lib/plan/limits";
import { rankSlabs } from "@/lib/smartfinder/fit";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { toSmartFinderResult } from "@/lib/smartfinder/serialize";

/** Marketplace result cap for Free; own inventory is never capped. */
const FREE_TIER_MARKET_CAP = 3;

/** Own statuses that still represent usable stock for nesting. */
const OWN_USABLE_STATUSES = new Set(["available", "hidden"]);

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

/**
 * Own inventory for SmartFinder: full slabs + remnants the vendor can still use.
 * Includes available and hidden (draft/private) stock; excludes sold/reserved/deleted.
 */
function selectOwnUsableSlabs<
  T extends {
    status: string;
    deletedAt?: Date | null;
    quantity?: number | null;
  },
>(slabs: T[]): T[] {
  return slabs.filter((slab) => {
    if (slab.deletedAt) return false;
    if (!OWN_USABLE_STATUSES.has(slab.status)) return false;
    // quantity 0 means nothing left to cut from
    if (typeof slab.quantity === "number" && slab.quantity <= 0) return false;
    return true;
  });
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

  const ownUsable = selectOwnUsableSlabs(ownSlabs);
  const marketSlabs = publicSlabs.filter((slab) => slab.vendorId !== user.id);

  // Own inventory: keep unscored rows so missing dimensions don't hide stock.
  const ownRanked = rankSlabs(ownUsable, pieces, { includeUnscored: true }).map(
    (result) => toSmartFinderResult(result, { isOwnListing: true }),
  );
  const marketRanked = rankSlabs(marketSlabs, pieces).map((result) =>
    toSmartFinderResult(result, { isOwnListing: false }),
  );

  const plan = effectivePlanForUser(user);
  const isPaid = plan === "pro" || plan === "premium";

  // Own inventory always predominates and is never free-capped.
  const ownResults = ownRanked;
  const marketResults = isPaid
    ? marketRanked
    : marketRanked.slice(0, FREE_TIER_MARKET_CAP);
  const limited = !isPaid && marketRanked.length > FREE_TIER_MARKET_CAP;

  const results = [...ownResults, ...marketResults];
  const totalMatches = ownRanked.length + marketRanked.length;

  return {
    results,
    ownResults,
    marketResults,
    totalMatches,
    limited,
  };
}
