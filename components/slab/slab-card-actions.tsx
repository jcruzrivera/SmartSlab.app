"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

import { toggleFavoriteAction } from "@/app/actions/marketplace";
import {
  COMPARE_CHANGE_EVENT,
  FAVORITES_CHANGE_EVENT,
  readCompareIds,
  readFavoriteIds,
  subscribeGuestStore,
  toggleGuestCompare,
  toggleGuestFavorite,
} from "@/lib/marketplace/guest-storage";

function subscribeCompare(onStoreChange: () => void) {
  return subscribeGuestStore(COMPARE_CHANGE_EVENT, onStoreChange);
}

function subscribeFavorites(onStoreChange: () => void) {
  return subscribeGuestStore(FAVORITES_CHANGE_EVENT, onStoreChange);
}

function readGuestFavorite(slabId: string): boolean {
  return readFavoriteIds().includes(slabId);
}

function SaveSubmit({ isFavorite }: { isFavorite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700"
    >
      {isFavorite ? "Saved" : "Save"}
    </button>
  );
}

export function SlabCardActions({
  slabId,
  initialIsFavorite = false,
}: {
  slabId: string;
  initialIsFavorite?: boolean;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
  const compareIds = useSyncExternalStore(
    subscribeCompare,
    readCompareIds,
    () => [],
  );
  const guestFavorite = useSyncExternalStore(
    subscribeFavorites,
    () => readGuestFavorite(slabId),
    () => false,
  );

  const inCompare = compareIds.includes(slabId);
  const isFavorite = isSignedIn
    ? (favoriteOverride ?? initialIsFavorite)
    : guestFavorite;

  function toggleCompare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleGuestCompare(slabId);
  }

  function toggleGuestSave(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleGuestFavorite(slabId);
  }

  async function toggleSignedInSave(formData: FormData) {
    setFavoriteOverride(!(favoriteOverride ?? initialIsFavorite));
    await toggleFavoriteAction(formData);
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="inline-block h-8 w-14" aria-hidden />
        <span className="inline-block h-8 w-20" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
      {isSignedIn ? (
        <form action={toggleSignedInSave}>
          <input type="hidden" name="slabId" value={slabId} />
          <SaveSubmit isFavorite={isFavorite} />
        </form>
      ) : (
        <button
          type="button"
          onClick={toggleGuestSave}
          className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
      )}
      <button
        type="button"
        onClick={toggleCompare}
        className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700"
      >
        {inCompare ? "In compare" : "Compare"}
      </button>
      {compareIds.length > 0 ? (
        <Link
          href="/compare"
          onClick={(event) => event.stopPropagation()}
          className="text-xs font-medium text-[#0d8fa8] hover:underline"
        >
          View compare ({compareIds.length})
        </Link>
      ) : null}
    </div>
  );
}
