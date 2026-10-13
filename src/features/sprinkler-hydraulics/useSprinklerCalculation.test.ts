import { describe, expect, it } from "vitest";
import {
  OLD_API_IDENTICAL_BRANCHES_WARNING,
  withIdenticalBranchNotice,
} from "./useSprinklerCalculation";
import type { SprinklerHydraulicResponse } from "./types";

function response(overrides: Partial<SprinklerHydraulicResponse> = {}): SprinklerHydraulicResponse {
  return {
    segments: [],
    totalDemandFlowGpm: 100,
    requiredPressureAtSupplyPsi: 50,
    availablePressureAtDemandPsi: null,
    safetyMarginPsi: null,
    safetyMarginPercent: null,
    passes: null,
    supplyCurve: [],
    warnings: ["something else"],
    ...overrides,
  };
}

describe("withIdenticalBranchNotice", () => {
  it("warns, first, when branches are declared identical and the service omitted the list", () => {
    const result = withIdenticalBranchNotice(response(), true);

    expect(result.warnings[0]).toBe(OLD_API_IDENTICAL_BRANCHES_WARNING);
    expect(result.warnings).toContain("something else");
  });

  it("says nothing when the service answered with the list, even an empty one", () => {
    const answered = response({ identicalBranches: [] });
    expect(withIdenticalBranchNotice(answered, true)).toBe(answered);
  });

  it("says nothing when no branch is declared identical, whatever the service is", () => {
    const plain = response();
    expect(withIdenticalBranchNotice(plain, false)).toBe(plain);
  });
});
