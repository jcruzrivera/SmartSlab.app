const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyFormatterPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numeric)) {
    return "—";
  }

  return currencyFormatter.format(numeric);
}

export function formatPricePrecise(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numeric)) {
    return "—";
  }

  return currencyFormatterPrecise.format(numeric);
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(numeric) ? null : numeric;
}

/**
 * Width and height are in inches; thickness is in centimeters (the regional
 * standard for slab thickness).
 */
export function formatDimensions(
  width: string | number | null | undefined,
  height: string | number | null | undefined,
  thickness: string | number | null | undefined,
): string {
  const w = toNumber(width);
  const h = toNumber(height);
  const t = toNumber(thickness);

  if (w === null && h === null && t === null) {
    return "Dimensions not provided";
  }

  const parts: string[] = [];

  if (w !== null && h !== null) {
    parts.push(`${trim(w)}" × ${trim(h)}"`);
  } else if (w !== null) {
    parts.push(`W ${trim(w)}"`);
  } else if (h !== null) {
    parts.push(`H ${trim(h)}"`);
  }

  if (t !== null) {
    parts.push(`${trim(t)} cm thick`);
  }

  return parts.join(" · ");
}

/**
 * Total area of the piece in square feet, computed from width × height (in
 * inches) divided by 144. Returns null when either dimension is missing.
 */
export function computeSqft(
  width: string | number | null | undefined,
  height: string | number | null | undefined,
): number | null {
  const w = toNumber(width);
  const h = toNumber(height);

  if (w === null || h === null || w <= 0 || h <= 0) {
    return null;
  }

  return (w * h) / 144;
}

export function formatSqft(
  width: string | number | null | undefined,
  height: string | number | null | undefined,
): string | null {
  const sqft = computeSqft(width, height);

  if (sqft === null) {
    return null;
  }

  return `${sqft.toFixed(1)} sq ft`;
}

export function formatLocation(
  city: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const segments = [city, state].filter(Boolean);
  return segments.length > 0 ? segments.join(", ") : null;
}

function trim(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
