"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateAdminSlabAction,
  type AdminSlabFormState,
} from "@/app/admin/actions";
import {
  updateSlabAction,
  type SlabFormState,
} from "@/app/dashboard/slabs/[id]/edit/actions";
import { createSlabAction } from "@/app/dashboard/slabs/new/actions";
import { ImageUploader } from "@/components/slab/image-uploader";
import { SlabEditActions } from "@/components/slab/slab-edit-actions";
import { AESTHETIC_OPTIONS, ROOM_OPTIONS } from "@/lib/search/filters";

type MaterialOption = { id: string; name: string };

export type SlabFormInitialValues = {
  name: string;
  type: "full_slab" | "remnant";
  materialId?: string | null;
  finish: string;
  colorFamily?: string | null;
  brandSupplier?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  widthCm?: string | null;
  heightCm?: string | null;
  thicknessCm?: string | null;
  price: string;
  quantity: number;
  isNegotiable: boolean;
  notes?: string | null;
  imageUrls: string[];
  roomUse?: string[] | null;
  aestheticTags?: string[] | null;
  status?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-900";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-[#1bb0ce] px-5 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

type SlabFormProps = {
  materials: MaterialOption[];
  mode?: "create" | "edit" | "admin";
  slabId?: string;
  initialValues?: SlabFormInitialValues;
};

export function SlabForm({
  materials,
  mode = "create",
  slabId,
  initialValues,
}: SlabFormProps) {
  const action =
    mode === "admin"
      ? updateAdminSlabAction
      : mode === "edit"
        ? updateSlabAction
        : createSlabAction;

  const [state, formAction] = useActionState<
    SlabFormState | AdminSlabFormState,
    FormData
  >(action, {});

  const [widthIn, setWidthIn] = useState(initialValues?.widthCm ?? "");
  const [heightIn, setHeightIn] = useState(initialValues?.heightCm ?? "");
  const [slabType, setSlabType] = useState<"full_slab" | "remnant">(
    initialValues?.type ?? "full_slab",
  );
  const [rooms, setRooms] = useState<string[]>(initialValues?.roomUse ?? []);
  const [aesthetics, setAesthetics] = useState<string[]>(
    initialValues?.aestheticTags ?? [],
  );

  function toggleValue(
    list: string[],
    setList: (next: string[]) => void,
    value: string,
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  }

  const w = Number.parseFloat(widthIn);
  const h = Number.parseFloat(heightIn);
  const totalSqft =
    Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
      ? (w * h) / 144
      : null;

  const isSold = initialValues?.status === "sold";

  return (
    <div className="flex flex-col gap-6">
      {mode === "edit" && initialValues?.status === "hidden" ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          This listing is hidden from the marketplace. Publish it again when
          you are ready.
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-5">
        {mode !== "create" && slabId ? (
          <input type="hidden" name="slabId" value={slabId} />
        ) : null}

        <Field label="Listing name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={initialValues?.name}
            disabled={isSold}
            placeholder="e.g. Calacatta Gold Quartz Remnant"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="type">
            <select
              id="type"
              name="type"
              className={inputClass}
              value={slabType}
              onChange={(event) =>
                setSlabType(event.target.value as "full_slab" | "remnant")
              }
              disabled={isSold}
            >
              <option value="full_slab">Full slab</option>
              <option value="remnant">Remnant</option>
            </select>
          </Field>

          <Field label="Material" htmlFor="materialId">
            <select
              id="materialId"
              name="materialId"
              className={inputClass}
              defaultValue={initialValues?.materialId ?? ""}
              disabled={isSold}
            >
              <option value="">Select material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Finish" htmlFor="finish">
            <select
              id="finish"
              name="finish"
              className={inputClass}
              defaultValue={initialValues?.finish ?? "polished"}
              disabled={isSold}
            >
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
              defaultValue={initialValues?.colorFamily ?? ""}
              disabled={isSold}
              placeholder="e.g. white, black, beige"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Width (in)" htmlFor="widthCm">
            <input
              id="widthCm"
              name="widthCm"
              type="number"
              step="0.1"
              min="0"
              value={widthIn}
              onChange={(event) => setWidthIn(event.target.value)}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
          <Field label="Height (in)" htmlFor="heightCm">
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              step="0.1"
              min="0"
              value={heightIn}
              onChange={(event) => setHeightIn(event.target.value)}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
          <Field label="Thickness (cm)" htmlFor="thicknessCm">
            <input
              id="thicknessCm"
              name="thicknessCm"
              type="number"
              step="0.1"
              min="0"
              defaultValue={initialValues?.thicknessCm ?? ""}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-slate-600 dark:text-slate-300">Total Sqft</span>
          <span className="font-semibold">
            {totalSqft !== null ? `${totalSqft.toFixed(1)} sq ft` : "N/A"}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-medium">Location</p>
          <p className="text-xs text-slate-500">
            Only city, state and ZIP are shown publicly. Your exact address and
            phone stay private until a buyer completes payment.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="city">
              <input
                id="city"
                name="city"
                defaultValue={initialValues?.city ?? ""}
                disabled={isSold}
                placeholder="e.g. Miami"
                className={inputClass}
              />
            </Field>
            <Field label="State" htmlFor="state">
              <input
                id="state"
                name="state"
                defaultValue={initialValues?.state ?? ""}
                disabled={isSold}
                placeholder="e.g. FL"
                className={inputClass}
              />
            </Field>
            <Field label="ZIP code" htmlFor="zip">
              <input
                id="zip"
                name="zip"
                defaultValue={initialValues?.zip ?? ""}
                disabled={isSold}
                placeholder="e.g. 33101"
                className={inputClass}
              />
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            We use the city, state, and ZIP to place your slab on the map so
            nearby buyers can find it. The exact address stays private.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Room / application</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROOM_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="roomUse"
                  value={option.value}
                  checked={rooms.includes(option.value)}
                  onChange={() => toggleValue(rooms, setRooms, option.value)}
                  disabled={isSold}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Aesthetic</span>
          <div className="flex flex-wrap gap-2">
            {aesthetics.map((value) => (
              <input
                key={value}
                type="hidden"
                name="aestheticTags"
                value={value}
              />
            ))}
            {AESTHETIC_OPTIONS.map((option) => {
              const active = aesthetics.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSold}
                  onClick={() =>
                    toggleValue(aesthetics, setAesthetics, option.value)
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-[#1bb0ce] bg-[#1bb0ce] text-white"
                      : "border-slate-300 text-slate-600 hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (USD)" htmlFor="price">
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initialValues?.price}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
          {slabType === "full_slab" ? (
            <Field label="Quantity available" htmlFor="quantity">
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max="999"
                defaultValue={initialValues?.quantity ?? 1}
                disabled={isSold}
                className={inputClass}
              />
              <p className="text-xs text-slate-500">
                Each sale reduces this by 1; the listing closes at 0.
              </p>
            </Field>
          ) : (
            <input type="hidden" name="quantity" value={1} />
          )}
          <Field label="Brand / supplier" htmlFor="brandSupplier">
            <input
              id="brandSupplier"
              name="brandSupplier"
              defaultValue={initialValues?.brandSupplier ?? ""}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Photos</span>
          {!isSold ? (
            <ImageUploader initialUrls={initialValues?.imageUrls ?? []} />
          ) : (
            <p className="text-sm text-slate-500">
              Photos cannot be changed on sold listings.
            </p>
          )}
        </div>

        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initialValues?.notes ?? ""}
            disabled={isSold}
            placeholder="Veining, edges, condition, pickup details..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-900"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isNegotiable"
            defaultChecked={initialValues?.isNegotiable}
            disabled={isSold}
            className="h-4 w-4 rounded border-slate-300"
          />
          Price is negotiable
        </label>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {state.error}
          </p>
        ) : null}

        {!isSold ? (
          <SubmitButton
            label={mode === "create" ? "Publish listing" : "Save changes"}
          />
        ) : null}
      </form>

      {mode === "edit" && slabId && initialValues?.status ? (
        <SlabEditActions slabId={slabId} status={initialValues.status} />
      ) : null}
    </div>
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
