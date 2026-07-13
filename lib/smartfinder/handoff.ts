/** Client-side handoff of SmartFinder pieces onto a slab detail page. */

import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";

export const SMARTFINDER_SESSION_KEY = "smartslab.smartfinder.pieces";
export const SMARTFINDER_SEED_KEY = "smartslab.smartfinder.seedPieces";

export type SmartfinderHandoff = {
  pieces: Piece[];
  slabId: string;
  createdAt: number;
  /** Cached search candidates so the slab page can suggest alternatives
   *  for leftover/oversized pieces without burning another search quota. */
  ownResults?: SmartFinderResult[];
  marketResults?: SmartFinderResult[];
};

/** Seed SmartFinder's Define pieces step with leftover pieces. */
export function seedSmartfinderPieces(pieces: Piece[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SMARTFINDER_SEED_KEY,
      JSON.stringify({ pieces, createdAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

/** Peek leftover-piece seed without consuming it. */
export function peekSmartfinderSeed(): Piece[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SMARTFINDER_SEED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { pieces?: Piece[]; createdAt?: number };
    if (!Array.isArray(data.pieces) || data.pieces.length === 0) return null;
    if (
      typeof data.createdAt === "number" &&
      Date.now() - data.createdAt > 2 * 60 * 60 * 1000
    ) {
      return null;
    }
    return data.pieces;
  } catch {
    return null;
  }
}

/** Clear leftover-piece seed after SmartFinder has applied it. */
export function clearSmartfinderSeed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SMARTFINDER_SEED_KEY);
  } catch {
    // ignore
  }
}

/** Consume a one-shot piece seed (returns null if missing/expired). */
export function consumeSmartfinderSeed(): Piece[] | null {
  const pieces = peekSmartfinderSeed();
  clearSmartfinderSeed();
  return pieces;
}

export function saveSmartfinderHandoff(
  slabId: string,
  pieces: Piece[],
  candidates?: {
    ownResults?: SmartFinderResult[];
    marketResults?: SmartFinderResult[];
  },
): void {
  if (typeof window === "undefined") return;
  const payload: SmartfinderHandoff = {
    slabId,
    pieces,
    createdAt: Date.now(),
    ownResults: candidates?.ownResults,
    marketResults: candidates?.marketResults,
  };
  try {
    sessionStorage.setItem(SMARTFINDER_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function readSmartfinderHandoff(
  slabId: string,
): SmartfinderHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SMARTFINDER_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SmartfinderHandoff;
    if (
      !data ||
      data.slabId !== slabId ||
      !Array.isArray(data.pieces) ||
      data.pieces.length === 0
    ) {
      return null;
    }
    // Expire after 2 hours
    if (Date.now() - data.createdAt > 2 * 60 * 60 * 1000) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
