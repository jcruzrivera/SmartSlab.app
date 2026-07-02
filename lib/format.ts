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
    return "N/A";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numeric)) {
    return "N/A";
  }

  return currencyFormatter.format(numeric);
}

/** Shared listing price label for cards and detail pages. */
export function formatSlabPrice(
  price: string | number | null | undefined,
  isNegotiable = false,
): string {
  const numeric =
    price === null || price === undefined
      ? null
      : typeof price === "string"
        ? Number(price)
        : price;

  if (isNegotiable && (numeric === null || Number.isNaN(numeric) || numeric <= 0)) {
    return "Negotiable";
  }

  return formatPrice(price);
}

export function formatPricePrecise(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numeric)) {
    return "N/A";
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
 * Width and height are in inches; thickness is in centimeters.
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
    parts.push(`${trim(w)}" x ${trim(h)}"`);
  } else if (w !== null) {
    parts.push(`W ${trim(w)}"`);
  } else if (h !== null) {
    parts.push(`H ${trim(h)}"`);
  }

  if (t !== null) {
    parts.push(`${trim(t)} cm thick`);
  }

  return parts.join(" | ");
}

/**
 * Total area of the piece in square feet, computed from width x height in
 * inches divided by 144.
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
