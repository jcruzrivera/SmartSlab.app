"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestQuoteAction,
  type QuoteFormState,
} from "@/app/actions/marketplace";

type QuoteRequestFormProps = {
  slabId: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-[#1bb0ce] px-5 text-sm font-medium text-[#0d8fa8] transition hover:bg-[#1bb0ce] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending..." : "Request quote"}
    </button>
  );
}

export function QuoteRequestForm({
  slabId,
  defaultName,
  defaultEmail,
  defaultPhone,
}: QuoteRequestFormProps) {
  const [state, formAction] = useActionState<QuoteFormState, FormData>(
    requestQuoteAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <input type="hidden" name="slabId" value={slabId} />
      <p className="text-sm font-semibold">Ask for a quote</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="buyerName"
          defaultValue={defaultName ?? ""}
          placeholder="Name or company"
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          name="buyerEmail"
          type="email"
          required
          defaultValue={defaultEmail ?? ""}
          placeholder="Email"
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          name="buyerPhone"
          defaultValue={defaultPhone ?? ""}
          placeholder="Phone"
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-950"
        />
        <textarea
          name="message"
          required
          rows={3}
          placeholder="Tell the vendor what size, pickup/delivery timing, and questions you have."
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-950 sm:col-span-2"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SubmitButton />
        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}
