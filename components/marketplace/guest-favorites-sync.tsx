"use client";

import { SignedIn, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { syncGuestFavoritesAction } from "@/app/actions/marketplace";
import {
  clearGuestFavorites,
  readFavoriteIds,
} from "@/lib/marketplace/guest-storage";

const SYNC_FLAG_KEY = "smartslab.guest-favorites-synced";

function GuestFavoritesSyncInner() {
  const { user } = useUser();
  const userId = user?.id;
  const hasRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || hasRunRef.current === userId) {
      return;
    }

    if (sessionStorage.getItem(SYNC_FLAG_KEY) === userId) {
      hasRunRef.current = userId;
      return;
    }

    const guestFavoriteIds = readFavoriteIds();
    if (guestFavoriteIds.length === 0) {
      sessionStorage.setItem(SYNC_FLAG_KEY, userId);
      hasRunRef.current = userId;
      return;
    }

    hasRunRef.current = userId;

    void syncGuestFavoritesAction(guestFavoriteIds)
      .then(({ merged }) => {
        sessionStorage.setItem(SYNC_FLAG_KEY, userId);
        if (merged > 0) {
          clearGuestFavorites();
        }
      })
      .catch(() => {
        hasRunRef.current = null;
        sessionStorage.removeItem(SYNC_FLAG_KEY);
      });
  }, [userId]);

  return null;
}

export function GuestFavoritesSync() {
  return (
    <SignedIn>
      <GuestFavoritesSyncInner />
    </SignedIn>
  );
}
