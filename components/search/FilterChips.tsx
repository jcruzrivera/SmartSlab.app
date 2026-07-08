"use client";

import type { FilterChipDescriptor } from "@/lib/search/filters";
import { useFilterNav } from "@/components/search/use-filter-nav";

export function FilterChips({ chips }: { chips: FilterChipDescriptor[] }) {
  const { toggleCsv, deleteParams, clearAll } = useFilterNav();

  if (chips.length === 0) {
    return null;
  }

  function remove(chip: FilterChipDescriptor) {
    if (chip.value !== undefined) {
      toggleCsv(chip.key, chip.value);
      return;
    }
    if (chip.key === "price") {
      deleteParams("price_min", "price_max");
      return;
    }
    deleteParams(chip.key);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.value ?? ""}`}
          type="button"
          onClick={() => remove(chip)}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-strong transition hover:bg-brand/20"
        >
          {chip.label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline dark:text-slate-400"
      >
        Clear all
      </button>
    </div>
  );
}
