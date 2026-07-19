/**
 * Parse/format inch dimensions as decimals + carpenter fractions.
 * All studio dimension inputs go through parseInches; all dimension labels
 * render through formatInches (nearest 1/16", reduced fraction).
 */

const MAX_INCHES = 1000;

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅐": 1 / 7,
  "⅑": 1 / 9,
  "⅒": 0.1,
};

/**
 * Parse a dimension string into decimal inches.
 * Accepts: "36", "36.5", ".75", "1/2", "3/16", "36 1/2", "36-1/2",
 * unicode fractions alone ("¾") or attached ("36½", "25 ¼"),
 * optional trailing `"` or "in". Returns null for anything invalid,
 * non-positive, or above 1000.
 */
export function parseInches(input: string): number | null {
  if (typeof input !== "string") return null;

  let s = input.trim().toLowerCase();
  if (s.length === 0) return null;

  // Strip unit suffixes.
  s = s.replace(/(?:"|''|in(?:ches|ch)?\.?)\s*$/i, "").trim();
  if (s.length === 0) return null;

  // Extract a trailing unicode fraction (possibly glued to the number).
  let unicodeValue = 0;
  const lastChar = s.charAt(s.length - 1);
  if (lastChar in UNICODE_FRACTIONS) {
    unicodeValue = UNICODE_FRACTIONS[lastChar]!;
    s = s.slice(0, -1).trim();
    if (s.length === 0) {
      return validRange(unicodeValue);
    }
    // Remaining part must be a plain whole/decimal number.
    const whole = parseDecimal(s);
    if (whole === null) return null;
    return validRange(whole + unicodeValue);
  }

  // "W N/D" or "W-N/D" (mixed number with ASCII fraction).
  const mixed = s.match(/^(\d+(?:\.\d+)?)[\s-]+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (den === 0) return null;
    return validRange(whole + num / den);
  }

  // Bare "N/D".
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (den === 0) return null;
    return validRange(num / den);
  }

  const dec = parseDecimal(s);
  if (dec === null) return null;
  return validRange(dec);
}

function parseDecimal(s: string): number | null {
  if (!/^(\d+(\.\d+)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function validRange(n: number): number | null {
  if (!Number.isFinite(n) || n <= 0 || n > MAX_INCHES) return null;
  return n;
}

/**
 * Format decimal inches as the nearest 1/16" mixed fraction, reduced.
 * 36.5 → "36 1/2", 0.0625 → "1/16", 36 → "36". Ties round half-up.
 */
export function formatInches(value: number): string {
  if (!Number.isFinite(value)) return "0";

  const sixteenths = Math.round(value * 16);
  const whole = Math.floor(sixteenths / 16);
  let num = sixteenths - whole * 16;

  if (num === 0) return String(whole);

  let den = 16;
  while (num % 2 === 0) {
    num /= 2;
    den /= 2;
  }

  if (whole === 0) return `${num}/${den}`;
  return `${whole} ${num}/${den}`;
}
