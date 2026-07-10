/** Client-side handoff of SmartFinder pieces onto a slab detail page. */

import type { Piece } from "@/lib/smartfinder/types";

export const SMARTFINDER_SESSION_KEY = "smartslab.smartfinder.pieces";

export type SmartfinderHandoff = {
  pieces: Piece[];
  slabId: string;
  createdAt: number;
};

export function saveSmartfinderHandoff(
  slabId: string,
  pieces: Piece[],
): void {
  if (typeof window === "undefined") return;
  const payload: SmartfinderHandoff = {
    slabId,
    pieces,
    createdAt: Date.now(),
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
