"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { startCheckout, type CheckoutState } from "@/app/connect/store/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecting..." : "Buy now"}
    </button>
  );
}

export function BuyButton({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    startCheckout,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="productId" value={productId} />
      <SubmitButton />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-600 dark:bg-red-950/40">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
