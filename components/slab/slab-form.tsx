"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createSlabAction,
  type CreateSlabState,
} from "@/app/dashboard/slabs/new/actions";
import { ImageUploader } from "@/components/slab/image-uploader";

type MaterialOption = { id: string; name: string };

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-900";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-5 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Publishing..." : "Publish listing"}
    </button>
  );
}

export function SlabForm({ materials }: { materials: MaterialOption[] }) {
  const [state, formAction] = useActionState<CreateSlabState, FormData>(
    createSlabAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Listing name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Calacatta Gold Quartz Remnant"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="type">
          <select id="type" name="type" className={inputClass} defaultValue="full_slab">
            <option value="full_slab">Full slab</option>
            <option value="remnant">Remnant</option>
          </select>
        </Field>

        <Field label="Material" htmlFor="materialId">
          <select id="materialId" name="materialId" className={inputClass}>
            <option value="">Select material</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Finish" htmlFor="finish">
          <select id="finish" name="finish" className={inputClass} defaultValue="polished">
            <option value="polished">Polished</option>
            <option value="honed">Honed</option>
            <option value="leathered">Leathered</option>
            <option value="brushed">Brushed</option>
            <option value="sandblasted">Sandblasted</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Color family" htmlFor="colorFamily">
          <input
            id="colorFamily"
            name="colorFamily"
            placeholder="e.g. white, black, beige"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Width (cm)" htmlFor="widthCm">
          <input id="widthCm" name="widthCm" type="number" step="0.1" min="0" className={inputClass} />
        </Field>
        <Field label="Height (cm)" htmlFor="heightCm">
          <input id="heightCm" name="heightCm" type="number" step="0.1" min="0" className={inputClass} />
        </Field>
        <Field label="Thickness (cm)" htmlFor="thicknessCm">
          <input id="thicknessCm" name="thicknessCm" type="number" step="0.1" min="0" className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (USD)" htmlFor="price">
          <input id="price" name="price" type="number" step="0.01" min="0" required className={inputClass} />
        </Field>
        <Field label="Quantity" htmlFor="quantity">
          <input id="quantity" name="quantity" type="number" min="1" defaultValue={1} className={inputClass} />
        </Field>
        <Field label="Brand / supplier" htmlFor="brandSupplier">
          <input id="brandSupplier" name="brandSupplier" className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Photos</span>
        <ImageUploader />
      </div>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Veining, edges, condition, pickup details..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-900"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isNegotiable" className="h-4 w-4 rounded border-slate-300" />
        Price is negotiable
      </label>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {state.error}
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
