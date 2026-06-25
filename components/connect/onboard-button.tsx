"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { startOnboarding, type OnboardingState } from "@/app/connect/onboarding/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-5 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecting to Stripe..." : label}
    </button>
  );
}

export function OnboardButton({ label }: { label: string }) {
  const [state, formAction] = useActionState<OnboardingState, FormData>(
    startOnboarding,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton label={label} />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
