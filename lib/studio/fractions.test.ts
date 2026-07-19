import { describe, expect, it } from "vitest";

import { formatInches, parseInches } from "./fractions";

describe("parseInches", () => {
  it("parses whole numbers and decimals", () => {
    expect(parseInches("36")).toBe(36);
    expect(parseInches("36.5")).toBe(36.5);
    expect(parseInches(".75")).toBe(0.75);
  });

  it("parses bare and mixed ASCII fractions", () => {
    expect(parseInches("1/2")).toBe(0.5);
    expect(parseInches("3/16")).toBe(0.1875);
    expect(parseInches("36 1/2")).toBe(36.5);
    expect(parseInches("36-1/2")).toBe(36.5);
  });

  it("parses unicode fractions alone and attached", () => {
    expect(parseInches("¾")).toBe(0.75);
    expect(parseInches("36½")).toBe(36.5);
    expect(parseInches("25 ¼")).toBe(25.25);
  });

  it("strips unit suffixes", () => {
    expect(parseInches('36 1/2"')).toBe(36.5);
    expect(parseInches("36in")).toBe(36);
  });

  it("returns null for invalid input", () => {
    expect(parseInches("")).toBeNull();
    expect(parseInches("abc")).toBeNull();
    expect(parseInches("1/0")).toBeNull();
    expect(parseInches("-5")).toBeNull();
    expect(parseInches("0")).toBeNull();
    expect(parseInches("12/")).toBeNull();
    expect(parseInches("1e9")).toBeNull();
    expect(parseInches("2000")).toBeNull();
  });
});

describe("formatInches", () => {
  it("formats whole numbers plainly", () => {
    expect(formatInches(36)).toBe("36");
  });

  it("formats reduced mixed fractions", () => {
    expect(formatInches(36.5)).toBe("36 1/2");
    expect(formatInches(25.25)).toBe("25 1/4");
    expect(formatInches(0.0625)).toBe("1/16");
  });

  it("rounds to the nearest 1/16 with ties up", () => {
    // 36.03125 is exactly halfway between 36 and 36 1/16 → half-up.
    expect(formatInches(36.03125)).toBe("36 1/16");
    expect(formatInches(36.01)).toBe("36");
  });

  it("round-trips values on the 1/16 grid", () => {
    for (let sixteenths = 1; sixteenths <= 16 * 40; sixteenths++) {
      const value = sixteenths / 16;
      expect(parseInches(formatInches(value))).toBe(value);
    }
  });
});
