import { describe, expect, it } from "vitest";

import { ensureUniqueShortCode } from "./short-code";
import { effectivePlanForUser } from "@/lib/plan/limits";

describe("P1: CSV import shortCode batch assignment", () => {
  it("assigns a unique shortCode per row including within-batch collisions", async () => {
    const batchCodes = new Set<string>();
    const codes: string[] = [];

    for (let i = 0; i < 5; i++) {
      const shortCode = await ensureUniqueShortCode(async (code) =>
        batchCodes.has(code),
      );
      batchCodes.add(shortCode);
      codes.push(shortCode);
    }

    expect(codes).toHaveLength(5);
    expect(codes.every((c) => Boolean(c) && c.length === 8)).toBe(true);
    expect(new Set(codes).size).toBe(5);
  });
});

describe("P1: dashboard badge uses effective plan", () => {
  it("shows free when stored plan is pro but status is canceled", () => {
    const displayPlan = effectivePlanForUser({
      clerkId: "user_regular",
      plan: "pro",
      planStatus: "canceled",
    });
    expect(displayPlan).toBe("free");
  });

  it("shows premium for lifetime partners regardless of DB plan", () => {
    const displayPlan = effectivePlanForUser({
      clerkId: "user_3Fup4yqXpzi7jh5AO1g7Jso8B2D",
      plan: "free",
      planStatus: "none",
    });
    expect(displayPlan).toBe("premium");
  });
});
