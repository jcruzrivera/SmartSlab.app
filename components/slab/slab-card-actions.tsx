"use client";

import Link from "next/link";
import { useRef } from "react";
import { useSyncExternalStore } from "react";

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

export function SlabCardActions({
  slabId,
  initialIsFavorite = false,
  persistFavorites = false,
}: {
  slabId: string;
  initialIsFavorite?: boolean;
  persistFavorites?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
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
  const isFavorite = guestFavorite || initialIsFavorite;

  function toggleCompare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleGuestCompare(slabId);
  }

  function toggleSave(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleGuestFavorite(slabId);

    if (persistFavorites) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
      {persistFavorites ? (
        <form ref={formRef} action={toggleFavoriteAction} className="contents">
          <input type="hidden" name="slabId" value={slabId} />
        </form>
      ) : null}
      <button
        type="button"
        onClick={toggleSave}
        className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium transition hover:border-brand hover:text-brand-strong dark:border-slate-700"
      >
        {isFavorite ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={toggleCompare}
        className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium transition hover:border-brand hover:text-brand-strong dark:border-slate-700"
      >
        {inCompare ? "In compare" : "Compare"}
      </button>
      {compareIds.length > 0 ? (
        <Link
          href="/compare"
          onClick={(event) => event.stopPropagation()}
          className="text-xs font-medium text-brand-strong hover:underline"
        >
          View compare ({compareIds.length})
        </Link>
      ) : null}
    </div>
  );
}
