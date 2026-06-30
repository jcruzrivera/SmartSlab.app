/** Production storefront origin (Namecheap domain on Vercel). */
export const CANONICAL_APP_ORIGIN = "https://smartslab.store";

export const CANONICAL_APP_HOST = "smartslab.store";

const WWW_CANONICAL_HOST = `www.${CANONICAL_APP_HOST}`;

/** Normalize apex vs www so Clerk cookies and redirect URLs stay on one host. */
export function normalizeAppHost(host: string | null | undefined): string | null {
  if (!host) return null;

  const bare = host.split(":")[0]?.toLowerCase();
  if (!bare) return null;

  return bare === WWW_CANONICAL_HOST ? CANONICAL_APP_HOST : bare;
}
