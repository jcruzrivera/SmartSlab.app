import { describe, expect, it } from "vitest";

import {
  ensureUniqueShortCode,
  generateShortCode,
  SHORT_CODE_ALPHABET,
  SHORT_CODE_LENGTH,
} from "./short-code";

describe("generateShortCode", () => {
  it("is 8 characters by default", () => {
    expect(generateShortCode()).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("respects a custom length", () => {
    expect(generateShortCode(12)).toHaveLength(12);
  });

  it("only uses alphabet characters and never the ambiguous 0/O/1/I/L", () => {
    const allowed = new Set(SHORT_CODE_ALPHABET.split(""));
    for (let i = 0; i < 500; i += 1) {
      const code = generateShortCode();
      for (const char of code) {
        expect(allowed.has(char)).toBe(true);
      }
      expect(/[01OIL]/.test(code)).toBe(false);
    }
  });
});

describe("ensureUniqueShortCode", () => {
  it("returns the first non-colliding code", async () => {
    const code = await ensureUniqueShortCode(async () => false);
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("retries past collisions until a free code is found", async () => {
    let calls = 0;
    const code = await ensureUniqueShortCode(async () => {
      calls += 1;
      // Collide on the first two attempts, then accept.
      return calls <= 2;
    });
    expect(calls).toBe(3);
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("throws when it can never find a free code", async () => {
    await expect(
      ensureUniqueShortCode(async () => true, SHORT_CODE_LENGTH, 3),
    ).rejects.toThrow(/unique short code/);
  });
});
