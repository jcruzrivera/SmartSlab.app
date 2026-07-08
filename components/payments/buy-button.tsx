"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { startCheckout, type CheckoutState } from "@/app/checkout/actions";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Starting checkout..." : "Buy now"}
    </button>
  );
}

export function BuyButton({ slabId }: { slabId: string }) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    startCheckout,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="slabId" value={slabId} />
      <Submit />
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
