"use client";

import { useFormStatus } from "react-dom";

import { toggleFavoriteAction } from "@/app/actions/marketplace";

function Button({
  isFavorite,
  disabled,
}: {
  isFavorite: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:border-[#1bb0ce] hover:text-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700"
    >
      {isFavorite ? "Saved" : "Save"}
    </button>
  );
}

export function FavoriteButton({
  slabId,
  isFavorite,
  disabled,
}: {
  slabId: string;
  isFavorite: boolean;
  disabled?: boolean;
}) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="slabId" value={slabId} />
      <Button isFavorite={isFavorite} disabled={disabled} />
    </form>
  );
}
