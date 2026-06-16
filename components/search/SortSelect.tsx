"use client";

import { useFilterNav } from "@/components/search/use-filter-nav";
import { SORT_OPTIONS, type SlabSort } from "@/lib/search/filters";

export function SortSelect({ value }: { value: SlabSort }) {
  const { setParam } = useFilterNav();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={value}
        onChange={(event) =>
          setParam(
            "sort",
            event.target.value === "newest" ? null : event.target.value,
          )
        }
        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-[#1bb0ce] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export type { SlabSort };
