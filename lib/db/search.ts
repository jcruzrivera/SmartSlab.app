import { desc, inArray } from "drizzle-orm";

import { getDb, isDbConfigured } from "@/lib/db/client";
import { slabs } from "@/lib/db/schema";
import type { SlabWithRelations } from "@/lib/db/slabs";
import {
  COLOR_OPTIONS,
  type SearchFilters,
  type SlabSort,
} from "@/lib/search/filters";

export type Facets = {
  material: Record<string, number>;
  type: Record<string, number>;
  color: Record<string, number>;
  finish: Record<string, number>;
  thickness: Record<string, number>;
  brand: Record<string, number>;
  room: Record<string, number>;
  aesthetic: Record<string, number>;
};

export type BrandOption = { value: string; label: string };

export type SearchResult = {
  slabs: SlabWithRelations[];
  total: number;
  facets: Facets;
  brandOptions: BrandOption[];
};

const slabRelations = {
  images: true,
  material: { columns: { id: true, name: true, slug: true } },
  vendor: { columns: { id: true, companyName: true } },
} as const;

type FilterDimension =
  | "material"
  | "type"
  | "color"
  | "finish"
  | "thickness"
  | "brand"
  | "room"
  | "aesthetic";

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function normalizeBrand(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function sqftOf(slab: SlabWithRelations): number | null {
  const w = num(slab.widthIn);
  const h = num(slab.heightIn);
  if (w === null || h === null || w <= 0 || h <= 0) return null;
  return (w * h) / 144; // width/height are inches
}

function pricePerSqftOf(slab: SlabWithRelations): number | null {
  const stored = num(slab.pricePerSqft);
  if (stored !== null) return stored;
  const sqft = sqftOf(slab);
  const price = num(slab.price);
  if (sqft && sqft > 0 && price !== null) return price / sqft;
  return null;
}

/** Color options a slab matches, based on its free-text color family. */
function colorsOf(slab: SlabWithRelations): string[] {
  const haystack = (slab.colorFamily ?? "").toLowerCase();
  if (!haystack) return [];
  return COLOR_OPTIONS.filter((option) => {
    if (option.value === "multicolor") {
      return haystack.includes("multi");
    }
    return haystack.includes(option.value);
  }).map((option) => option.value);
}

function thicknessBucketOf(slab: SlabWithRelations): string | null {
  const t = num(slab.thicknessCm);
  if (t === null) return null;
  if (t < 1.5) return "1";
  if (t < 2.5) return "2";
  if (t < 3.5) return "3";
  return "4plus";
}

function matchesText(slab: SlabWithRelations, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [
    slab.name,
    slab.colorFamily,
    slab.brandSupplier,
    slab.material?.name,
    slab.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

/**
 * Returns true when a slab matches every filter, optionally skipping one
 * dimension (used to compute faceted counts).
 */
function matches(
  slab: SlabWithRelations,
  filters: SearchFilters,
  skip?: FilterDimension,
): boolean {
  if (!matchesText(slab, filters.q)) return false;

  if (skip !== "material" && filters.material.length > 0) {
    if (!slab.material || !filters.material.includes(slab.material.slug)) {
      return false;
    }
  }

  if (skip !== "type" && filters.type.length > 0) {
    if (!filters.type.includes(slab.type)) return false;
  }

  if (skip !== "color" && filters.color.length > 0) {
    const slabColors = colorsOf(slab);
    if (!filters.color.some((c) => slabColors.includes(c))) return false;
  }

  if (skip !== "finish" && filters.finish.length > 0) {
    if (!filters.finish.includes(slab.finish)) return false;
  }

  if (skip !== "thickness" && filters.thickness.length > 0) {
    const bucket = thicknessBucketOf(slab);
    if (!bucket || !filters.thickness.includes(bucket)) return false;
  }

  if (skip !== "brand" && filters.brand.length > 0) {
    if (!filters.brand.includes(normalizeBrand(slab.brandSupplier))) {
      return false;
    }
  }

  if (skip !== "room" && filters.room.length > 0) {
    const rooms = slab.roomUse ?? [];
    if (!filters.room.some((r) => rooms.includes(r))) return false;
  }

  if (skip !== "aesthetic" && filters.aesthetic.length > 0) {
    const tags = slab.aestheticTags ?? [];
    if (!filters.aesthetic.some((a) => tags.includes(a))) return false;
  }

  const price = num(slab.price) ?? 0;
  if (price < filters.priceMin || price > filters.priceMax) return false;

  if (filters.minSqft > 0) {
    const sqft = sqftOf(slab);
    if (sqft === null || sqft < filters.minSqft) return false;
  }

  if (filters.negotiable && !slab.isNegotiable) return false;

  return true;
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function computeFacets(
  base: SlabWithRelations[],
  filters: SearchFilters,
): Facets {
  const facets: Facets = {
    material: {},
    type: {},
    color: {},
    finish: {},
    thickness: {},
    brand: {},
    room: {},
    aesthetic: {},
  };

  for (const slab of base) {
    if (matches(slab, filters, "material") && slab.material) {
      increment(facets.material, slab.material.slug);
    }
    if (matches(slab, filters, "type")) {
      increment(facets.type, slab.type);
    }
    if (matches(slab, filters, "color")) {
      for (const color of colorsOf(slab)) increment(facets.color, color);
    }
    if (matches(slab, filters, "finish")) {
      increment(facets.finish, slab.finish);
    }
    if (matches(slab, filters, "thickness")) {
      const bucket = thicknessBucketOf(slab);
      if (bucket) increment(facets.thickness, bucket);
    }
    if (matches(slab, filters, "brand")) {
      const brand = normalizeBrand(slab.brandSupplier);
      if (brand) increment(facets.brand, brand);
    }
    if (matches(slab, filters, "room")) {
      for (const room of slab.roomUse ?? []) increment(facets.room, room);
    }
    if (matches(slab, filters, "aesthetic")) {
      for (const tag of slab.aestheticTags ?? []) {
        increment(facets.aesthetic, tag);
      }
    }
  }

  return facets;
}

function sortSlabs(
  items: SlabWithRelations[],
  sort: SlabSort,
): SlabWithRelations[] {
  const sorted = [...items];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => (num(a.price) ?? 0) - (num(b.price) ?? 0));
    case "price_desc":
      return sorted.sort((a, b) => (num(b.price) ?? 0) - (num(a.price) ?? 0));
    case "sqft_desc":
      return sorted.sort((a, b) => (sqftOf(b) ?? 0) - (sqftOf(a) ?? 0));
    case "ppsf_asc":
      return sorted.sort((a, b) => {
        const pa = pricePerSqftOf(a);
        const pb = pricePerSqftOf(b);
        return (pa ?? Number.POSITIVE_INFINITY) - (pb ?? Number.POSITIVE_INFINITY);
      });
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

/**
 * Full marketplace search. Fetches the public base set (available, plus
 * reserved when the buyer opts in) and applies all filters, faceting and
 * sorting in memory — appropriate for the current catalog size.
 */
export async function searchSlabs(
  filters: SearchFilters,
): Promise<SearchResult> {
  if (!isDbConfigured()) {
    return {
      slabs: [],
      total: 0,
      facets: {
        material: {},
        type: {},
        color: {},
        finish: {},
        thickness: {},
        brand: {},
        room: {},
        aesthetic: {},
      },
      brandOptions: [],
    };
  }

  const statuses = filters.available
    ? (["available"] as const)
    : (["available", "reserved"] as const);

  const db = getDb();
  const rows = (await db.query.slabs.findMany({
    where: inArray(slabs.status, [...statuses]),
    with: slabRelations,
    orderBy: desc(slabs.createdAt),
    limit: 500,
  })) as SlabWithRelations[];

  const matched = rows.filter((slab) => matches(slab, filters));
  const sorted = sortSlabs(matched, filters.sort);
  const facets = computeFacets(rows, filters);

  // Distinct brands present in the base set, for the sidebar dropdown.
  const brandMap = new Map<string, string>();
  for (const slab of rows) {
    const label = (slab.brandSupplier ?? "").trim();
    if (label) brandMap.set(normalizeBrand(label), label);
  }
  const brandOptions: BrandOption[] = [...brandMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { slabs: sorted, total: sorted.length, facets, brandOptions };
}
