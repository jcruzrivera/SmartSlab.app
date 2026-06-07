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

export function formatDimensions(
  widthCm: string | number | null | undefined,
  heightCm: string | number | null | undefined,
  thicknessCm: string | number | null | undefined,
): string {
  const width = toNumber(widthCm);
  const height = toNumber(heightCm);
  const thickness = toNumber(thicknessCm);

  if (width === null && height === null && thickness === null) {
    return "Dimensions not provided";
  }

  const parts: string[] = [];

  if (width !== null && height !== null) {
    parts.push(`${trim(width)} × ${trim(height)} cm`);
  } else if (width !== null) {
    parts.push(`W ${trim(width)} cm`);
  } else if (height !== null) {
    parts.push(`H ${trim(height)} cm`);
  }

  if (thickness !== null) {
    parts.push(`${trim(thickness)} cm thick`);
  }

  return parts.join(" · ");
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
