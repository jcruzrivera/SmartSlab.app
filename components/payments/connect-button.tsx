"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  startConnectOnboarding,
  type ConnectState,
} from "@/app/dashboard/payments/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecting to Stripe..." : label}
    </button>
  );
}

export function ConnectButton({ label }: { label: string }) {
  const [state, formAction] = useActionState<ConnectState, FormData>(
    startConnectOnboarding,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Submit label={label} />
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
