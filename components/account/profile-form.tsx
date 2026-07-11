"use client";

import { useActionState, useState } from "react";
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
  role?: string | null;
  storeSlug?: string | null;
  storePublic?: boolean;
  storeSlugLocked?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

function isVendorRole(role: string | null | undefined): boolean {
  return role === "vendor" || role === "both";
}

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

function StoreUrlCopy({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://smartslab.app/tienda/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/50">
      <span className="text-slate-600 dark:text-slate-300">
        Tu tienda pública:{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-strong underline-offset-2 hover:underline"
        >
          smartslab.app/tienda/{slug}
        </a>
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export function ProfileForm({ initial }: { initial: ProfileInitialValues }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );

  const vendor = isVendorRole(initial.role);

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
          <input
            id="city"
            name="city"
            defaultValue={initial.city ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="State" htmlFor="state">
          <input
            id="state"
            name="state"
            defaultValue={initial.state ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="ZIP" htmlFor="zip">
          <input
            id="zip"
            name="zip"
            defaultValue={initial.zip ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        Your address and phone stay private. They are only shared with a buyer
        after they complete payment through SmartSlab.
      </p>

      {vendor ? (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Public storefront
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              WordPress storefronts at smartslab.app/tienda use this URL. You
              can edit the slug once.
            </p>
          </div>

          {initial.storeSlug ? (
            <StoreUrlCopy slug={initial.storeSlug} />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Se generará al guardar el nombre de empresa / primer listing.
            </p>
          )}

          <Field label="Store URL slug" htmlFor="storeSlug">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-slate-500">
                smartslab.app/tienda/
              </span>
              <input
                id="storeSlug"
                name="storeSlug"
                defaultValue={initial.storeSlug ?? ""}
                disabled={Boolean(initial.storeSlugLocked)}
                placeholder="e.g. marmoles-pena"
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
            {initial.storeSlugLocked ? (
              <p className="mt-1 text-xs text-slate-500">
                Slug locked after your one-time edit.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Lowercase letters, numbers, and hyphens. Editable once.
              </p>
            )}
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="storePublic"
              value="on"
              defaultChecked={initial.storePublic !== false}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            Show my store publicly
          </label>
        </div>
      ) : null}

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
