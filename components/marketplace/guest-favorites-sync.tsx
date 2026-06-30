"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

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
  const hasRunRef = useRef<string | null>(null);
  const refreshPageRef = useRef(router.refresh);
  useLayoutEffect(() => {
    refreshPageRef.current = router.refresh;
  });

  useEffect(() => {
    if (!isLoaded || !userId || hasRunRef.current === userId) {
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
          refreshPageRef.current();
        }
      })
      .catch(() => {
        hasRunRef.current = null;
      });
  }, [isLoaded, userId]);

  return null;
}
