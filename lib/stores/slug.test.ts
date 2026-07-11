import { describe, expect, it } from "vitest";

import {
  ensureUniqueStoreSlug,
  isReservedStoreSlug,
  normalizeStoreSlug,
} from "./slug";

describe("normalizeStoreSlug", () => {
  it("strips accents and normalizes punctuation", () => {
    expect(normalizeStoreSlug("Mármoles Peña")).toBe("marmoles-pena");
    expect(normalizeStoreSlug("Mármoles Peña & Hijos")).toBe(
      "marmoles-pena-hijos",
    );
  });

  it("collapses hyphens and trims edges", () => {
    expect(normalizeStoreSlug("  All---In Remodeling!! ")).toBe(
      "all-in-remodeling",
    );
  });

  it("falls back to store for empty input", () => {
    expect(normalizeStoreSlug("!!!")).toBe("store");
    expect(normalizeStoreSlug("")).toBe("store");
  });

  it("caps length at 60 characters", () => {
    const long = "a".repeat(80);
    expect(normalizeStoreSlug(long).length).toBe(60);
  });
});

describe("isReservedStoreSlug", () => {
  it("flags reserved paths", () => {
    expect(isReservedStoreSlug("admin")).toBe(true);
    expect(isReservedStoreSlug("tienda")).toBe(true);
    expect(isReservedStoreSlug("graniteshop")).toBe(false);
  });
});

describe("ensureUniqueStoreSlug", () => {
  it("returns the base when available", async () => {
    const slug = await ensureUniqueStoreSlug("Granite Shop", async () => false);
    expect(slug).toBe("granite-shop");
  });

  it("suffixes reserved bases", async () => {
    const slug = await ensureUniqueStoreSlug("admin", async () => false);
    expect(slug).toBe("admin-2");
  });

  it("appends -2, -3 on collision", async () => {
    const taken = new Set(["graniteshop", "graniteshop-2"]);
    const slug = await ensureUniqueStoreSlug("graniteshop", async (candidate) =>
      taken.has(candidate),
    );
    expect(slug).toBe("graniteshop-3");
  });
});
