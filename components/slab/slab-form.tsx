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
import { PlanLimitNotice } from "@/components/billing/plan-limit-notice";
import {
  enrichSuggestedPrice,
  matchMaterialId,
  type SlabImageAnalysis,
} from "@/lib/ai/slab-analysis";
import { formatPrice } from "@/lib/format";
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
  widthIn?: string | null;
  heightIn?: string | null;
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
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

const VALID_FINISHES = new Set([
  "polished",
  "honed",
  "leathered",
  "brushed",
  "sandblasted",
  "other",
]);

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
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

  const [widthIn, setWidthIn] = useState(initialValues?.widthIn ?? "");
  const [heightIn, setHeightIn] = useState(initialValues?.heightIn ?? "");
  const [slabType, setSlabType] = useState<"full_slab" | "remnant">(
    initialValues?.type ?? "full_slab",
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [materialId, setMaterialId] = useState(initialValues?.materialId ?? "");
  const [finish, setFinish] = useState(initialValues?.finish ?? "polished");
  const [colorFamily, setColorFamily] = useState(initialValues?.colorFamily ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [rooms, setRooms] = useState<string[]>(initialValues?.roomUse ?? []);
  const [aesthetics, setAesthetics] = useState<string[]>(
    initialValues?.aestheticTags ?? [],
  );
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [thicknessCm, setThicknessCm] = useState(initialValues?.thicknessCm ?? "");
  const [brandSupplier, setBrandSupplier] = useState(
    initialValues?.brandSupplier ?? "",
  );
  const [hasPhoto, setHasPhoto] = useState(
    (initialValues?.imageUrls?.length ?? 0) > 0,
  );
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [priceNote, setPriceNote] = useState<string | null>(null);

  const isCreate = mode === "create";
  const isSold = initialValues?.status === "sold";
  const planUpgradeTo =
    "upgradeTo" in state &&
    (state.upgradeTo === "pro" || state.upgradeTo === "premium")
      ? state.upgradeTo
      : undefined;

  function applyAnalysis(raw: SlabImageAnalysis) {
    const analysis = enrichSuggestedPrice(raw);

    if (analysis.name) {
      setName(analysis.name);
    }
    if (analysis.type) {
      setSlabType(analysis.type);
    }
    const matchedMaterial = matchMaterialId(analysis.material, materials);
    if (matchedMaterial) {
      setMaterialId(matchedMaterial);
    }
    if (analysis.finish && VALID_FINISHES.has(analysis.finish)) {
      setFinish(analysis.finish);
    }
    if (analysis.colorFamily) {
      setColorFamily(analysis.colorFamily);
    }
    if (analysis.notes) {
      setNotes(analysis.notes);
    }
    if (analysis.brandSupplier) {
      setBrandSupplier(analysis.brandSupplier);
    }
    if (analysis.widthIn) {
      setWidthIn(String(analysis.widthIn));
    }
    if (analysis.heightIn) {
      setHeightIn(String(analysis.heightIn));
    }
    if (analysis.thicknessCm) {
      setThicknessCm(String(analysis.thicknessCm));
    }
    if (analysis.roomUse?.length) {
      setRooms(analysis.roomUse);
    }
    if (analysis.aestheticTags?.length) {
      setAesthetics(analysis.aestheticTags);
    }
    if (analysis.suggestedPriceUsd && analysis.suggestedPriceUsd > 0) {
      setSuggestedPrice(analysis.suggestedPriceUsd);
      setPrice(String(analysis.suggestedPriceUsd));
      setPriceNote(analysis.priceNote ?? null);
    }
  }

  function applySuggestedPrice() {
    if (suggestedPrice && suggestedPrice > 0) {
      setPrice(String(suggestedPrice));
    }
  }

  const photoSection = (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>Photos</span>
      {isCreate ? (
        <p className="text-xs text-slate-500">
          Start with a photo from your gallery or camera. SmartSlab can suggest
          listing details automatically.
        </p>
      ) : null}
      {!isSold ? (
        <ImageUploader
          initialUrls={initialValues?.imageUrls ?? []}
          enableAnalysis={isCreate}
          onAnalysis={isCreate ? applyAnalysis : undefined}
          onUrlsChange={isCreate ? (urls) => setHasPhoto(urls.length > 0) : undefined}
        />
      ) : (
        <p className="text-sm text-slate-500">
          Photos cannot be changed on sold listings.
        </p>
      )}
    </div>
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

        {isCreate ? photoSection : null}

        {isCreate && !hasPhoto ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700">
            Add at least one photo to unlock the listing form. SmartSlab uses AI
            to suggest material, dimensions, and a starting price.
          </p>
        ) : null}

        {isCreate && hasPhoto && suggestedPrice && suggestedPrice > 0 ? (
          <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-strong">
                  Suggested list price
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatPrice(suggestedPrice)}
                </p>
                {priceNote ? (
                  <p className="mt-1 text-xs text-slate-500">{priceNote}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={applySuggestedPrice}
                className="inline-flex h-9 items-center rounded-lg border border-brand px-3 text-sm font-medium text-brand-strong transition hover:bg-brand/10"
              >
                Use suggested price
              </button>
            </div>
          </div>
        ) : null}

        {(!isCreate || hasPhoto) && (
          <>
        <Field label="Listing name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            value={isCreate ? name : undefined}
            defaultValue={isCreate ? undefined : initialValues?.name}
            onChange={isCreate ? (event) => setName(event.target.value) : undefined}
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
              value={isCreate ? materialId : undefined}
              defaultValue={isCreate ? undefined : initialValues?.materialId ?? ""}
              onChange={
                isCreate ? (event) => setMaterialId(event.target.value) : undefined
              }
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
              value={isCreate ? finish : undefined}
              defaultValue={isCreate ? undefined : initialValues?.finish ?? "polished"}
              onChange={
                isCreate ? (event) => setFinish(event.target.value) : undefined
              }
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
              value={isCreate ? colorFamily : undefined}
              defaultValue={isCreate ? undefined : initialValues?.colorFamily ?? ""}
              onChange={
                isCreate
                  ? (event) => setColorFamily(event.target.value)
                  : undefined
              }
              disabled={isSold}
              placeholder="e.g. white, black, beige"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Width (in)" htmlFor="widthIn">
            <input
              id="widthIn"
              name="widthIn"
              type="number"
              step="0.1"
              min="0"
              value={widthIn}
              onChange={(event) => setWidthIn(event.target.value)}
              disabled={isSold}
              className={inputClass}
            />
          </Field>
          <Field label="Height (in)" htmlFor="heightIn">
            <input
              id="heightIn"
              name="heightIn"
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
              value={isCreate ? thicknessCm : undefined}
              defaultValue={isCreate ? undefined : initialValues?.thicknessCm ?? ""}
              onChange={
                isCreate
                  ? (event) => setThicknessCm(event.target.value)
                  : undefined
              }
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
                      ? "border-brand bg-brand text-white"
                      : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand-strong dark:border-slate-700 dark:text-slate-300"
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
              value={isCreate ? price : undefined}
              defaultValue={isCreate ? undefined : initialValues?.price}
              onChange={isCreate ? (event) => setPrice(event.target.value) : undefined}
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
              value={isCreate ? brandSupplier : undefined}
              defaultValue={isCreate ? undefined : initialValues?.brandSupplier ?? ""}
              onChange={
                isCreate
                  ? (event) => setBrandSupplier(event.target.value)
                  : undefined
              }
              disabled={isSold}
              className={inputClass}
            />
          </Field>
        </div>

        {!isCreate ? photoSection : null}

        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={isCreate ? notes : undefined}
            defaultValue={isCreate ? undefined : initialValues?.notes ?? ""}
            onChange={isCreate ? (event) => setNotes(event.target.value) : undefined}
            disabled={isSold}
            placeholder="Veining, edges, condition, pickup details..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900"
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
          planUpgradeTo ? (
            <PlanLimitNotice
              message={state.error}
              upgradeTo={planUpgradeTo}
            />
          ) : (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {state.error}
            </p>
          )
        ) : null}

        {!isSold ? (
          <SubmitButton
            label={mode === "create" ? "Publish listing" : "Save changes"}
          />
        ) : null}
          </>
        )}
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
