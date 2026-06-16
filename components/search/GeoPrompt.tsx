"use client";

import { useBuyerGeo } from "@/components/search/GeoProvider";

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function GeoPrompt() {
  const { geo, promptVisible, requesting, requestPrecise, keepApproximate } =
    useBuyerGeo();

  if (!promptVisible) {
    return null;
  }

  const place = geo?.city
    ? `${geo.city}${geo.region ? `, ${geo.region}` : ""}`
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#1bb0ce]/30 bg-[#1bb0ce]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <span className="text-[#0d8fa8]">
          <PinIcon />
        </span>
        {place
          ? `We detected you're near ${place}. Allow precise location for nearby results?`
          : "Allow location access to find slabs near you."}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={requestPrecise}
          disabled={requesting}
          className="inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:opacity-60"
        >
          {requesting ? "Locating…" : "Use my location"}
        </button>
        <button
          type="button"
          onClick={keepApproximate}
          className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
        >
          {place ? `Keep ${geo?.city}` : "Not now"}
        </button>
      </div>
    </div>
  );
}
