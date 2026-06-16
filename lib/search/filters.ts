/**
 * Search/filter model for the marketplace browse experience.
 *
 * The URL query string is the single source of truth for filters, which makes
 * every search shareable and SSR-friendly. This module centralizes the filter
 * types, the option taxonomies (shared by the UI and the query layer), and the
 * URL <-> filters serialization.
 */

export type SlabSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "sqft_desc"
  | "ppsf_asc";

export type SearchFilters = {
  q: string;
  material: string[]; // material slugs
  type: string[]; // full_slab | remnant
  color: string[]; // color family keys
  finish: string[];
  thickness: string[]; // 1 | 2 | 3 | 4plus (centimeters)
  brand: string[];
  priceMin: number;
  priceMax: number;
  minSqft: number;
  available: boolean;
  negotiable: boolean;
  sort: SlabSort;
};

export const PRICE_MIN = 0;
export const PRICE_MAX = 5000;
export const SQFT_MAX = 200;

export const DEFAULT_FILTERS: SearchFilters = {
  q: "",
  material: [],
  type: [],
  color: [],
  finish: [],
  thickness: [],
  brand: [],
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  minSqft: 0,
  available: true,
  negotiable: false,
  sort: "newest",
};

export const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "full_slab", label: "Full slab" },
  { value: "remnant", label: "Remnant" },
];

export const FINISH_OPTIONS: { value: string; label: string }[] = [
  { value: "polished", label: "Polished" },
  { value: "honed", label: "Honed" },
  { value: "leathered", label: "Leathered" },
  { value: "brushed", label: "Brushed" },
  { value: "sandblasted", label: "Sandblasted" },
  { value: "other", label: "Other" },
];

export const THICKNESS_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 cm" },
  { value: "2", label: "2 cm" },
  { value: "3", label: "3 cm" },
  { value: "4plus", label: "4 cm+" },
];

export const COLOR_OPTIONS: {
  value: string;
  label: string;
  swatch: string;
  ring?: boolean;
}[] = [
  { value: "white", label: "White", swatch: "#ffffff", ring: true },
  { value: "black", label: "Black", swatch: "#111827" },
  { value: "grey", label: "Grey", swatch: "#9ca3af" },
  { value: "beige", label: "Beige", swatch: "#e7d8b1" },
  { value: "brown", label: "Brown", swatch: "#8b5e34" },
  { value: "gold", label: "Gold", swatch: "#d4af37" },
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "green", label: "Green", swatch: "#16a34a" },
  { value: "red", label: "Red / Pink", swatch: "#ef4444" },
  {
    value: "multicolor",
    label: "Multicolor",
    swatch:
      "conic-gradient(from 0deg, #ef4444, #f59e0b, #16a34a, #3b82f6, #a855f7, #ef4444)",
  },
];

export const SORT_OPTIONS: { value: SlabSort; label: string }[] = [
  { value: "newest", label: "Newest listings" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "sqft_desc", label: "Largest slab first" },
  { value: "ppsf_asc", label: "Price per sq ft: low to high" },
];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

function splitCsv(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function toNumber(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parses filters from URLSearchParams. Unknown/invalid values fall back to the
 * defaults so a malformed shared link never crashes the page.
 */
export function parseFilters(params: URLSearchParams): SearchFilters {
  const sortParam = params.get("sort");

  return {
    q: (params.get("q") ?? "").slice(0, 120),
    material: splitCsv(params.get("material")),
    type: splitCsv(params.get("type")),
    color: splitCsv(params.get("color")),
    finish: splitCsv(params.get("finish")),
    thickness: splitCsv(params.get("thickness")),
    brand: splitCsv(params.get("brand")),
    priceMin: Math.max(PRICE_MIN, toNumber(params.get("price_min"), PRICE_MIN)),
    priceMax: Math.min(PRICE_MAX, toNumber(params.get("price_max"), PRICE_MAX)),
    minSqft: Math.max(0, toNumber(params.get("min_sqft"), 0)),
    available: params.get("available") !== "false",
    negotiable: params.get("negotiable") === "true",
    sort: sortParam && SORT_VALUES.has(sortParam) ? (sortParam as SlabSort) : "newest",
  };
}

export type FilterChipDescriptor = {
  /** URL param key this chip controls. */
  key: string;
  /** CSV member to remove (for multi-select params); omitted for scalars. */
  value?: string;
  label: string;
};

const TYPE_LABELS = new Map(TYPE_OPTIONS.map((o) => [o.value, o.label]));
const FINISH_LABELS = new Map(FINISH_OPTIONS.map((o) => [o.value, o.label]));
const THICKNESS_LABELS = new Map(THICKNESS_OPTIONS.map((o) => [o.value, o.label]));
const COLOR_LABELS = new Map(COLOR_OPTIONS.map((o) => [o.value, o.label]));

/**
 * Builds the list of removable chips for the active filters. Labels for
 * material and brand come from the caller (they are data-derived).
 */
export function buildActiveChips(
  filters: SearchFilters,
  labels: {
    material: Record<string, string>;
    brand: Record<string, string>;
  },
): FilterChipDescriptor[] {
  const chips: FilterChipDescriptor[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: `“${filters.q}”` });
  }
  for (const value of filters.material) {
    chips.push({ key: "material", value, label: labels.material[value] ?? value });
  }
  for (const value of filters.type) {
    chips.push({ key: "type", value, label: TYPE_LABELS.get(value) ?? value });
  }
  for (const value of filters.color) {
    chips.push({ key: "color", value, label: COLOR_LABELS.get(value) ?? value });
  }
  for (const value of filters.finish) {
    chips.push({ key: "finish", value, label: FINISH_LABELS.get(value) ?? value });
  }
  for (const value of filters.thickness) {
    chips.push({
      key: "thickness",
      value,
      label: THICKNESS_LABELS.get(value) ?? value,
    });
  }
  for (const value of filters.brand) {
    chips.push({ key: "brand", value, label: labels.brand[value] ?? value });
  }
  if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) {
    chips.push({
      key: "price",
      label: `$${filters.priceMin} – $${filters.priceMax}`,
    });
  }
  if (filters.minSqft > 0) {
    chips.push({ key: "min_sqft", label: `≥ ${filters.minSqft} sq ft` });
  }
  if (!filters.available) {
    chips.push({ key: "available", label: "Incl. reserved" });
  }
  if (filters.negotiable) {
    chips.push({ key: "negotiable", label: "Negotiable" });
  }

  return chips;
}

/**
 * Number of user-applied filters (used for the mobile "Filters (N)" badge and
 * the "Clear" affordance). Default availability is not counted.
 */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.q) count += 1;
  count += filters.material.length;
  count += filters.type.length;
  count += filters.color.length;
  count += filters.finish.length;
  count += filters.thickness.length;
  count += filters.brand.length;
  if (filters.priceMin > PRICE_MIN) count += 1;
  if (filters.priceMax < PRICE_MAX) count += 1;
  if (filters.minSqft > 0) count += 1;
  if (!filters.available) count += 1;
  if (filters.negotiable) count += 1;
  return count;
}
