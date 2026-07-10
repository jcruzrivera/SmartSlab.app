"use server";

import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { isPlanLimitError } from "@/lib/plan/enforce";
import { runSmartfinderSearch } from "@/lib/smartfinder/search";

export type { SmartFinderResult };

export type SmartFinderSearchState = {
  results: SmartFinderResult[];
  totalMatches: number;
  limited: boolean;
  error?: string;
  upgradeTo?: "pro" | "premium";
};

export async function findMatchingSlabs(
  rawPieces: Piece[],
): Promise<SmartFinderSearchState> {
  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return {
      results: [],
      totalMatches: 0,
      limited: false,
      error: "Sign in to use SmartFinder.",
    };
  }

  try {
    return await runSmartfinderSearch(user, rawPieces);
  } catch (error) {
    if (isPlanLimitError(error)) {
      return {
        results: [],
        totalMatches: 0,
        limited: false,
        error: error.message,
        upgradeTo: error.upgradeTo,
      };
    }
    return {
      results: [],
      totalMatches: 0,
      limited: false,
      error: "Could not run SmartFinder search.",
    };
  }
}
