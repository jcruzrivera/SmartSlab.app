/**
 * Geolocation helpers for the browse experience.
 *
 * Buyer coordinates are treated as sensitive: they live in localStorage +
 * React state on the client only, and are NEVER written to the URL or sent to
 * our servers. Distance math runs entirely in the browser.
 */
export type GeoSource = "browser" | "ip" | "manual";

export type BuyerGeo = {
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  source: GeoSource;
};

export type CachedGeo = BuyerGeo & { cachedAt: number };

export const RADIUS_OPTIONS = [25, 50, 100, 250] as const;
export const DEFAULT_RADIUS = 100;

const STORAGE_KEY = "smartslab_geo";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Great-circle distance between two points, in miles. */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "Here";
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}

export function readCachedGeo(): BuyerGeo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedGeo>;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.cachedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.cachedAt > MAX_AGE_MS) {
      return null;
    }
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      city: parsed.city ?? null,
      region: parsed.region ?? null,
      source: parsed.source ?? "ip",
    };
  } catch {
    return null;
  }
}

export function writeCachedGeo(geo: BuyerGeo): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedGeo = { ...geo, cachedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
}

export function clearCachedGeo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export type IpGeo = {
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
};

export async function fetchIpGeo(): Promise<IpGeo | null> {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as IpGeo;
  } catch {
    return null;
  }
}
