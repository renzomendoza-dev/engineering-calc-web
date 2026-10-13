import { describe, expect, it } from "vitest";
import { sizeForSprinklerCount } from "./defaults";

describe("sizeForSprinklerCount", () => {
  it("starts a branch at 1 in. and steps up as the pipe gathers sprinklers", () => {
    expect([1, 2, 3, 4, 5, 6, 10, 11].map(sizeForSprinklerCount)).toEqual([
      "1",
      "1",
      "1-1/4",
      "1-1/2",
      "1-1/2",
      "2",
      "2",
      "2-1/2",
    ]);
  });

  it("stays on the largest size in the table rather than running off the end of it", () => {
    expect(sizeForSprinklerCount(40)).toBe("3");
    expect(sizeForSprinklerCount(500)).toBe("3");
  });

  it("returns sizes in the catalog's own keys, which is what the API takes", () => {
    for (const count of [1, 3, 5, 10, 20, 40]) {
      expect(sizeForSprinklerCount(count)).toMatch(/^\d(-\d\/\d)?$/);
    }
  });
});
