/**
 * Server-side geocoding via OpenStreetMap Nominatim (free, no API key).
 *
 * Used when a vendor saves a listing: we turn the public city/state/ZIP into
 * approximate coordinates so buyers can search by distance. Nominatim asks for
 * a descriptive User-Agent and is rate-limited, which is fine here because we
 * only call it on save (a low-frequency action).
 */
export type GeoPoint = { lat: number; lng: number };

export function buildAddressQuery(parts: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  return [parts.city, parts.state, parts.zip]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
      encodeURIComponent(trimmed);

    const res = await fetch(url, {
      headers: { "User-Agent": "SmartSlab/1.0 (marketplace geocoding)" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) {
      return null;
    }

    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    // Never let a geocoding hiccup block saving a listing.
    return null;
  }
}
