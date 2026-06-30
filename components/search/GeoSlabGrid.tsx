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
export function GeoSlabGrid({
  slabs,
  favoriteSlabIds = [],
  canSyncFavorites = false,
}: {
  slabs: SlabWithRelations[];
  favoriteSlabIds?: string[];
  canSyncFavorites?: boolean;
}) {
  const { geo } = useBuyerGeo();
  const searchParams = useSearchParams();
  const radius = Number(searchParams.get("radius") ?? 0);
  const sort = searchParams.get("sort") ?? "newest";

  const favoriteSlabIdSet = new Set(favoriteSlabIds);

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
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-lg font-medium">No slabs match these filters</p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Try widening your distance radius or removing a filter.
        </p>
        <Link
          href="/dashboard/slabs/new"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          List a slab
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
            isFavorite={favoriteSlabIdSet.has(slab.id)}
            persistFavorites={canSyncFavorites}
          />
        ))}
      </div>
    </div>
  );
}
