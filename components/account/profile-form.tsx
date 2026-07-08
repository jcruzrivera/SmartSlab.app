"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateProfileAction, type ProfileState } from "@/app/account/actions";

export type ProfileInitialValues = {
  companyName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-fit items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save profile"}
    </button>
  );
}

export function ProfileForm({ initial }: { initial: ProfileInitialValues }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" htmlFor="companyName">
          <input
            id="companyName"
            name="companyName"
            defaultValue={initial.companyName ?? ""}
            placeholder="e.g. Roilabs Stone Co."
            className={inputClass}
          />
        </Field>
        <Field label="Contact name" htmlFor="contactName">
          <input
            id="contactName"
            name="contactName"
            defaultValue={initial.contactName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            defaultValue={initial.phone ?? ""}
            placeholder="e.g. +1 305 555 0123"
            className={inputClass}
          />
        </Field>
        <Field label="Country" htmlFor="country">
          <input
            id="country"
            name="country"
            defaultValue={initial.country ?? ""}
            placeholder="e.g. USA"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Address" htmlFor="address">
        <input
          id="address"
          name="address"
          defaultValue={initial.address ?? ""}
          placeholder="Street address (shared with buyers only after payment)"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city">
          <input id="city" name="city" defaultValue={initial.city ?? ""} className={inputClass} />
        </Field>
        <Field label="State" htmlFor="state">
          <input id="state" name="state" defaultValue={initial.state ?? ""} className={inputClass} />
        </Field>
        <Field label="ZIP" htmlFor="zip">
          <input id="zip" name="zip" defaultValue={initial.zip ?? ""} className={inputClass} />
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        Your address and phone stay private. They are only shared with a buyer
        after they complete payment through SmartSlab.
      </p>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Profile saved.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}
