"use server";

import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { isPlanLimitError } from "@/lib/plan/enforce";
import { runSmartfinderSearch } from "@/lib/smartfinder/search";

export type SmartFinderSearchState = {
  results: SmartFinderResult[];
  ownResults: SmartFinderResult[];
  marketResults: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
  error?: string;
  upgradeTo?: "pro" | "premium";
};

function emptyState(
  extra: Partial<SmartFinderSearchState> = {},
): SmartFinderSearchState {
  return {
    results: [],
    ownResults: [],
    marketResults: [],
    totalMatches: 0,
    limited: false,
    ...extra,
  };
}

export async function findMatchingSlabs(
  rawPieces: Piece[],
): Promise<SmartFinderSearchState> {
  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return emptyState({ error: "Sign in to use SmartFinder." });
  }

  try {
    return await runSmartfinderSearch(user, rawPieces);
  } catch (error) {
    if (isPlanLimitError(error)) {
      return emptyState({
        error: error.message,
        upgradeTo: error.upgradeTo,
      });
    }
    return emptyState({ error: "Could not run SmartFinder search." });
  }
}
