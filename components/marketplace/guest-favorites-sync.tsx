"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { syncGuestFavoritesAction } from "@/app/actions/marketplace";
import {
  clearGuestFavorites,
  readFavoriteIds,
} from "@/lib/marketplace/guest-storage";

export function GuestFavoritesSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncingRef.current) {
      return;
    }

    const guestFavoriteIds = readFavoriteIds();
    if (guestFavoriteIds.length === 0) {
      return;
    }

    syncingRef.current = true;

    void syncGuestFavoritesAction(guestFavoriteIds)
      .then(({ merged }) => {
        if (merged > 0) {
          clearGuestFavorites();
          router.refresh();
        }
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [isLoaded, isSignedIn, router]);

  return null;
}
