import type { DbUser } from "@/lib/db/users";
import { listPublicSlabs } from "@/lib/db/slabs";
import { consumeSmartfinderSearch } from "@/lib/plan/enforce";
import { effectivePlan } from "@/lib/plan/limits";
import { rankSlabs } from "@/lib/smartfinder/fit";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { toSmartFinderResult } from "@/lib/smartfinder/serialize";

const FREE_TIER_RESULT_CAP = 3;

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

export async function runSmartfinderSearch(
  user: DbUser,
  rawPieces: unknown,
): Promise<{
  results: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
}> {
  const pieces = validatePieces(rawPieces);
  if (!pieces) {
    return { results: [], totalMatches: 0, limited: false };
  }

  await consumeSmartfinderSearch(user);

  const slabs = await listPublicSlabs({ limit: 200 });
  const ranked = rankSlabs(slabs, pieces);

  const plan = effectivePlan(user.plan, user.planStatus);
  const isPaid = plan === "pro" || plan === "premium";
  const limit = isPaid ? ranked.length : FREE_TIER_RESULT_CAP;
  const limited = !isPaid && ranked.length > FREE_TIER_RESULT_CAP;

  return {
    results: ranked.slice(0, limit).map(toSmartFinderResult),
    totalMatches: ranked.length,
    limited,
  };
}
