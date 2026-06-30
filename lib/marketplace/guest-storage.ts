export const COMPARE_STORAGE_KEY = "smartslab.compare";
export const FAVORITES_STORAGE_KEY = "smartslab.favorites";
export const COMPARE_CHANGE_EVENT = "smartslab-compare-change";
export const FAVORITES_CHANGE_EVENT = "smartslab-favorites-change";

const MAX_COMPARE = 4;

function readStringIds(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStringIds(key: string, ids: string[]): void {
  window.localStorage.setItem(key, JSON.stringify(ids));
}

function notify(eventName: string): void {
  window.dispatchEvent(new Event(eventName));
}

export function readCompareIds(): string[] {
  return readStringIds(COMPARE_STORAGE_KEY);
}

export function readFavoriteIds(): string[] {
  return readStringIds(FAVORITES_STORAGE_KEY);
}

export function isInGuestCompare(slabId: string): boolean {
  return readCompareIds().includes(slabId);
}

export function isGuestFavorite(slabId: string): boolean {
  return readFavoriteIds().includes(slabId);
}

export function toggleGuestCompare(slabId: string): string[] {
  const ids = readCompareIds();
  const next = ids.includes(slabId)
    ? ids.filter((id) => id !== slabId)
    : [slabId, ...ids.filter((id) => id !== slabId)].slice(0, MAX_COMPARE);

  writeStringIds(COMPARE_STORAGE_KEY, next);
  notify(COMPARE_CHANGE_EVENT);
  return next;
}

export function toggleGuestFavorite(slabId: string): string[] {
  const ids = readFavoriteIds();
  const next = ids.includes(slabId)
    ? ids.filter((id) => id !== slabId)
    : [slabId, ...ids];

  writeStringIds(FAVORITES_STORAGE_KEY, next);
  notify(FAVORITES_CHANGE_EVENT);
  return next;
}

export function clearGuestFavorites(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
  notify(FAVORITES_CHANGE_EVENT);
}

export function subscribeGuestStore(
  eventName: string,
  onChange: () => void,
): () => void {
  function handleChange() {
    onChange();
  }

  window.addEventListener(eventName, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(eventName, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}
