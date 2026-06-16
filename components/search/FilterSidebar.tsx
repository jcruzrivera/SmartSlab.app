"use client";

import { useEffect, useRef, useState } from "react";

import { useFilterNav } from "@/components/search/use-filter-nav";
import type { BrandOption, Facets } from "@/lib/db/search";
import {
  COLOR_OPTIONS,
  FINISH_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  SQFT_MAX,
  THICKNESS_OPTIONS,
  TYPE_OPTIONS,
  type SearchFilters,
} from "@/lib/search/filters";

type MaterialOption = { id: string; name: string; slug: string };

type FilterSidebarProps = {
  filters: SearchFilters;
  materials: MaterialOption[];
  brandOptions: BrandOption[];
  facets: Facets;
};

export function FilterSidebar({
  filters,
  materials,
  brandOptions,
  facets,
}: FilterSidebarProps) {
  const { toggleCsv, setParam } = useFilterNav();

  return (
    <div className="flex flex-col gap-6 text-sm">
      <Section title="Material">
        <div className="flex flex-col gap-1.5">
          {materials.map((material) => (
            <CheckRow
              key={material.id}
              label={material.name}
              count={facets.material[material.slug] ?? 0}
              checked={filters.material.includes(material.slug)}
              onToggle={() => toggleCsv("material", material.slug)}
            />
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              count={facets.type[option.value] ?? 0}
              active={filters.type.includes(option.value)}
              onClick={() => toggleCsv("type", option.value)}
            />
          ))}
        </div>
      </Section>

      <Section title="Color">
        <div className="grid grid-cols-5 gap-2">
          {COLOR_OPTIONS.map((option) => {
            const active = filters.color.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleCsv("color", option.value)}
                title={`${option.label} (${facets.color[option.value] ?? 0})`}
                className="flex flex-col items-center gap-1"
                aria-pressed={active}
              >
                <span
                  className={`h-7 w-7 rounded-full border transition ${
                    active
                      ? "ring-2 ring-[#1bb0ce] ring-offset-1 dark:ring-offset-slate-900"
                      : "border-slate-300 dark:border-slate-600"
                  } ${option.ring ? "border-slate-300" : "border-transparent"}`}
                  style={{ background: option.swatch }}
                />
                <span className="text-[10px] leading-tight text-slate-500">
                  {option.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Finish">
        <div className="flex flex-col gap-1.5">
          {FINISH_OPTIONS.map((option) => (
            <CheckRow
              key={option.value}
              label={option.label}
              count={facets.finish[option.value] ?? 0}
              checked={filters.finish.includes(option.value)}
              onToggle={() => toggleCsv("finish", option.value)}
            />
          ))}
        </div>
      </Section>

      <Section title="Thickness">
        <div className="flex flex-wrap gap-2">
          {THICKNESS_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              count={facets.thickness[option.value] ?? 0}
              active={filters.thickness.includes(option.value)}
              onClick={() => toggleCsv("thickness", option.value)}
            />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <PriceRange
          min={filters.priceMin}
          max={filters.priceMax}
          onChange={(key, value) => setParam(key, value)}
        />
      </Section>

      <Section title="Size">
        <MinSqft value={filters.minSqft} onChange={(v) => setParam("min_sqft", v)} />
      </Section>

      {brandOptions.length > 0 ? (
        <Section title="Brand / supplier">
          <div className="flex max-h-44 flex-col gap-1.5 overflow-auto pr-1">
            {brandOptions.map((brand) => (
              <CheckRow
                key={brand.value}
                label={brand.label}
                count={facets.brand[brand.value] ?? 0}
                checked={filters.brand.includes(brand.value)}
                onToggle={() => toggleCsv("brand", brand.value)}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Availability">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.available}
              onChange={(event) =>
                setParam("available", event.target.checked ? null : "false")
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            In stock only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.negotiable}
              onChange={(event) =>
                setParam("negotiable", event.target.checked ? "true" : null)
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Negotiable price only
          </label>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 pb-5 last:border-0 last:pb-0 dark:border-slate-800">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={`flex items-center justify-between gap-2 ${
        disabled ? "cursor-default opacity-40" : "cursor-pointer"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300"
        />
        {label}
      </span>
      <span className="text-xs text-slate-400">{count}</span>
    </label>
  );
}

function Pill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-[#1bb0ce] bg-[#1bb0ce] text-white"
          : disabled
            ? "border-slate-200 text-slate-300 dark:border-slate-800"
            : "border-slate-300 text-slate-600 hover:border-[#1bb0ce] hover:text-[#0d8fa8] dark:border-slate-700 dark:text-slate-300"
      }`}
    >
      {label}
      {count > 0 ? <span className="ml-1 opacity-70">({count})</span> : null}
    </button>
  );
}

function PriceRange({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (key: "price_min" | "price_max", value: string | null) => void;
}) {
  const [localMin, setLocalMin] = useState(String(min));
  const [localMax, setLocalMax] = useState(String(max));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocalMin(String(min)), [min]);
  useEffect(() => setLocalMax(String(max)), [max]);

  function commit(key: "price_min" | "price_max", raw: string, fallback: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const parsed = Number(raw);
      const value = Number.isFinite(parsed) ? parsed : fallback;
      if (
        (key === "price_min" && value <= PRICE_MIN) ||
        (key === "price_max" && value >= PRICE_MAX)
      ) {
        onChange(key, null);
      } else {
        onChange(key, String(value));
      }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={localMin}
          onChange={(event) => {
            setLocalMin(event.target.value);
            commit("price_min", event.target.value, PRICE_MIN);
          }}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#1bb0ce] dark:border-slate-700 dark:bg-slate-900"
          aria-label="Minimum price"
        />
        <span className="text-slate-400">–</span>
        <input
          type="number"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={localMax}
          onChange={(event) => {
            setLocalMax(event.target.value);
            commit("price_max", event.target.value, PRICE_MAX);
          }}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#1bb0ce] dark:border-slate-700 dark:bg-slate-900"
          aria-label="Maximum price"
        />
      </div>
      <p className="text-xs text-slate-500">
        ${localMin || 0} – ${localMax || PRICE_MAX}
      </p>
    </div>
  );
}

function MinSqft({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: string | null) => void;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(value), [value]);

  function commit(next: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next > 0 ? String(next) : null);
    }, 400);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="range"
        min={0}
        max={SQFT_MAX}
        step={5}
        value={local}
        onChange={(event) => {
          const next = Number(event.target.value);
          setLocal(next);
          commit(next);
        }}
        className="w-full accent-[#1bb0ce]"
        aria-label="Minimum square feet"
      />
      <p className="text-xs text-slate-500">
        I need at least <span className="font-semibold">{local} sq ft</span>
      </p>
    </div>
  );
}
