"use client";

import { useEffect, useRef, useState } from "react";

import { useFilterNav } from "@/components/search/use-filter-nav";

type Suggestion = { label: string; value: string };

type SearchBarProps = {
  initialQuery: string;
  suggestions: Suggestion[];
};

export function SearchBar({ initialQuery, suggestions }: SearchBarProps) {
  const { setParam } = useFilterNav();
  const [value, setValue] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setValue(initialQuery);
  }

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const trimmed = value.trim().toLowerCase();
  const matches =
    trimmed.length > 0
      ? suggestions
          .filter((item) => item.label.toLowerCase().includes(trimmed))
          .slice(0, 8)
      : [];

  function pushQuery(next: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("q", next.trim() || null);
    }, 300);
  }

  function selectSuggestion(suggestion: Suggestion) {
    setValue(suggestion.value);
    setOpen(false);
    setHighlight(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setParam("q", suggestion.value);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) {
      if (event.key === "Enter") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setParam("q", value.trim() || null);
        setOpen(false);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) => (prev + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) => (prev <= 0 ? matches.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlight >= 0 && highlight < matches.length) {
        selectSuggestion(matches[highlight]);
      } else {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setParam("q", value.trim() || null);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {/* search glyph */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            setOpen(true);
            setHighlight(-1);
            pushQuery(next);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search slabs, colors, brands…"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-[#1bb0ce] focus:ring-2 focus:ring-[#1bb0ce]/30 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Search slabs"
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setParam("q", null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      {open && matches.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {matches.map((item, index) => (
            <li key={`${item.value}-${index}`}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(index)}
                onClick={() => selectSuggestion(item)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition ${
                  index === highlight
                    ? "bg-[#1bb0ce]/10 text-[#0d8fa8]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
