"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  deleteSlabAction,
  toggleSlabVisibilityAction,
  type SlabFormState,
} from "@/app/dashboard/slabs/[id]/edit/actions";

function ToggleButton({ isHidden }: { isHidden: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {pending
        ? "Updating..."
        : isHidden
          ? "Publish listing"
          : "Hide from marketplace"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950/40"
    >
      {pending ? "Deleting..." : "Delete listing"}
    </button>
  );
}

export function SlabEditActions({
  slabId,
  status,
}: {
  slabId: string;
  status: string;
}) {
  const [toggleState, toggleAction] = useActionState<SlabFormState, FormData>(
    toggleSlabVisibilityAction,
    {},
  );
  const [deleteState, deleteAction] = useActionState<SlabFormState, FormData>(
    deleteSlabAction,
    {},
  );

  if (status === "sold") {
    return (
      <p className="text-sm text-slate-500">
        This listing was sold and can no longer be edited or removed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
      <p className="text-sm font-medium">Listing actions</p>
      <div className="flex flex-wrap gap-3">
        <form action={toggleAction}>
          <input type="hidden" name="slabId" value={slabId} />
          <ToggleButton isHidden={status === "hidden"} />
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="slabId" value={slabId} />
          <DeleteButton />
        </form>
      </div>
      {toggleState.error ? (
        <p className="text-sm text-red-600">{toggleState.error}</p>
      ) : null}
      {deleteState.error ? (
        <p className="text-sm text-red-600">{deleteState.error}</p>
      ) : null}
    </div>
  );
}
