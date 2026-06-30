"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { syncGuestFavoritesAction } from "@/app/actions/marketplace";
import {
  clearGuestFavorites,
  readFavoriteIds,
} from "@/lib/marketplace/guest-storage";

const SYNC_FLAG_KEY = "smartslab.guest-favorites-synced";

export function GuestFavoritesSync() {
  const { isLoaded, user } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !userId || syncingRef.current) {
      return;
    }

    if (sessionStorage.getItem(SYNC_FLAG_KEY) === userId) {
      return;
    }

    const guestFavoriteIds = readFavoriteIds();
    if (guestFavoriteIds.length === 0) {
      sessionStorage.setItem(SYNC_FLAG_KEY, userId);
      return;
    }

    syncingRef.current = true;

    void syncGuestFavoritesAction(guestFavoriteIds)
      .then(({ merged }) => {
        sessionStorage.setItem(SYNC_FLAG_KEY, userId);
        if (merged > 0) {
          clearGuestFavorites();
          router.refresh();
        }
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [isLoaded, router, userId]);

  return null;
}
