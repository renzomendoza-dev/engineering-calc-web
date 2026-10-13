import { describe, expect, it } from "vitest";
import { comparePlanCount, moreThanPlanWarning } from "./planCount";

describe("comparePlanCount", () => {
  it("says which way the listed count differs from the plan's", () => {
    expect(comparePlanCount(11, 12)).toBe("fewer");
    expect(comparePlanCount(12, 12)).toBe("match");
    expect(comparePlanCount(13, 12)).toBe("more");
  });

  it("treats an empty list as fewer, not as a match", () => {
    expect(comparePlanCount(0, 12)).toBe("fewer");
  });
});

describe("moreThanPlanWarning", () => {
  it("states both counts and that the demand is for a larger area, not that it is invalid", () => {
    const text = moreThanPlanWarning(14, 12);

    expect(text).toContain("14");
    expect(text).toContain("12");
    expect(text).toContain("larger area of operation");
    expect(text).not.toMatch(/invalid/i);
  });
});
