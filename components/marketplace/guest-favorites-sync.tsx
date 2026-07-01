"use client";

import { useEffect, useRef } from "react";

import { syncGuestFavoritesAction } from "@/app/actions/marketplace";
import {
  clearGuestFavorites,
  readFavoriteIds,
} from "@/lib/marketplace/guest-storage";

const SYNC_FLAG_KEY = "smartslab.guest-favorites-synced";

export function GuestFavoritesSync() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current || sessionStorage.getItem(SYNC_FLAG_KEY) === "done") {
      return;
    }

    const guestFavoriteIds = readFavoriteIds();
    if (guestFavoriteIds.length === 0) {
      return;
    }

    hasRunRef.current = true;

    void syncGuestFavoritesAction(guestFavoriteIds)
      .then(({ merged }) => {
        if (merged > 0) {
          sessionStorage.setItem(SYNC_FLAG_KEY, "done");
          clearGuestFavorites();
        } else {
          hasRunRef.current = false;
        }
      })
      .catch(() => {
        hasRunRef.current = false;
      });
  }, []);

  return null;
}
