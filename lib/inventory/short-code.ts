import { randomInt } from "node:crypto";

/**
 * Human-readable alphabet for slab short codes. Deliberately excludes the
 * ambiguous characters 0/O, 1/I/L so a vendor can retype the code by hand if
 * the printed QR is damaged or dusty.
 */
export const SHORT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const SHORT_CODE_LENGTH = 8;

/**
 * Generates a random short code (default 8 chars) from {@link SHORT_CODE_ALPHABET}.
 * With 31 symbols and 8 positions the space is ~8.5e11, so collisions are rare
 * but still checked at insert time via {@link ensureUniqueShortCode}.
 */
export function generateShortCode(length: number = SHORT_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += SHORT_CODE_ALPHABET[randomInt(SHORT_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Returns a short code guaranteed unique against `exists`, retrying on the rare
 * collision. Throws after `maxAttempts` so a broken `exists` predicate can't
 * spin forever.
 */
export async function ensureUniqueShortCode(
  exists: (code: string) => Promise<boolean>,
  length: number = SHORT_CODE_LENGTH,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateShortCode(length);
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error(
    `Could not generate a unique short code after ${maxAttempts} attempts.`,
  );
}
