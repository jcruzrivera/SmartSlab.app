export const RESERVED_STORE_SLUGS = new Set([
  "api",
  "admin",
  "tienda",
  "tiendas",
  "store",
  "stores",
  "browse",
  "dashboard",
  "account",
  "slab",
  "sign-up",
  "sign-in",
  "developers",
  "how-it-works",
  "smartfinder",
]);

const MAX_SLUG_LENGTH = 60;

/**
 * Normalize a display name into a URL-safe store slug.
 * Example: "Mármoles Peña & Hijos" → "marmoles-pena-hijos"
 */
export function normalizeStoreSlug(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/g, "");

  return normalized || "store";
}

export function buildStoreSlugSource(user: {
  companyName?: string | null;
  contactName?: string | null;
}): string {
  const company = user.companyName?.trim();
  if (company) {
    return company;
  }
  const contact = user.contactName?.trim();
  if (contact) {
    return contact;
  }
  return "store";
}

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has(slug);
}

/**
 * Returns a unique slug. If `base` is reserved or taken, appends -2, -3, …
 */
export async function ensureUniqueStoreSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = normalizeStoreSlug(base).slice(0, MAX_SLUG_LENGTH);

  const candidates: string[] = [];
  if (!isReservedStoreSlug(root)) {
    candidates.push(root);
  }

  for (let n = 2; n < 10_000; n += 1) {
    const suffix = `-${n}`;
    const truncated = root.slice(0, MAX_SLUG_LENGTH - suffix.length);
    candidates.push(`${truncated}${suffix}`);
  }

  for (const candidate of candidates) {
    if (isReservedStoreSlug(candidate)) {
      continue;
    }
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Could not allocate a unique store slug.");
}
