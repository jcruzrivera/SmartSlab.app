"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useBuyerGeo } from "@/components/search/GeoProvider";
import { SlabCard } from "@/components/slab/slab-card";
import type { SlabWithRelations } from "@/lib/db/slabs";
import { haversineMiles } from "@/lib/search/geo";

/**
 * Results grid with client-side distance awareness. Non-geo filtering and
 * sorting already happened on the server; here we add per-card distance,
 * optional radius filtering, and "nearest first" sorting using the buyer's
 * coordinates — which never leave the browser.
 */
export function GeoSlabGrid({ slabs }: { slabs: SlabWithRelations[] }) {
  const { geo } = useBuyerGeo();
  const searchParams = useSearchParams();
  const radius = Number(searchParams.get("radius") ?? 0);
  const sort = searchParams.get("sort") ?? "newest";
  const query = (searchParams.get("q") ?? "").trim();
  const hasQuery = query.length > 0;
  const hasFilters =
    searchParams.has("material") ||
    searchParams.has("type") ||
    searchParams.has("color") ||
    searchParams.has("finish") ||
    searchParams.has("thickness") ||
    searchParams.has("brand") ||
    searchParams.has("room") ||
    searchParams.has("aesthetic") ||
    searchParams.has("price_min") ||
    searchParams.has("price_max") ||
    searchParams.has("min_sqft") ||
    searchParams.get("available") === "false" ||
    searchParams.get("negotiable") === "true";

  let items = slabs.map((slab) => {
    let distance: number | null = null;
    if (geo) {
      const lat = slab.lat !== null ? Number(slab.lat) : NaN;
      const lng = slab.lng !== null ? Number(slab.lng) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        distance = haversineMiles(geo.lat, geo.lng, lat, lng);
      }
    }
    return { slab, distance };
  });

  if (geo && radius > 0) {
    items = items.filter((it) => it.distance === null || it.distance <= radius);
  }

  if (geo && sort === "distance") {
    items = [...items].sort(
      (a, b) =>
        (a.distance ?? Number.POSITIVE_INFINITY) -
        (b.distance ?? Number.POSITIVE_INFINITY),
    );
  }

  if (items.length === 0) {
    const title = hasQuery
      ? `No results for “${query}”`
      : "No slabs match these filters";
    const description = hasQuery
      ? hasFilters
        ? "Try clearing the search term or removing a filter chip below."
        : "Try a different search term or browse all inventory."
      : "Try widening your distance radius or removing a filter chip below.";

    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-lg font-medium">{title}</p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
        <Link
          href="/browse"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          Browse all slabs
        </Link>
      </div>
    );
  }

  const nearbyCount =
    geo && radius > 0
      ? items.filter((it) => it.distance !== null).length
      : null;

  return (
    <div className="flex flex-col gap-3">
      {nearbyCount !== null ? (
        <p className="text-xs text-slate-500">
          {nearbyCount} within {radius} mi
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ slab, distance }) => (
          <SlabCard
            key={slab.id}
            slab={slab}
            distanceMiles={distance ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
