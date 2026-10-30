import { describe, expect, it } from "vitest";
import { STEPS } from "./schema";
import { NO_SUPPLY_WARNING_PREFIX, warningsForStep } from "./stepWarnings";

const noSupply = `${NO_SUPPLY_WARNING_PREFIX} — the demand figures are complete, but with nothing to compare against there is no safety margin or pass/fail verdict`;
const velocity =
  'Velocity in segment A->B is 22 fps (30 gpm in 1" pipe), above the 20 fps that normally needs justification';

describe("warningsForStep", () => {
  it("keeps the no-supply note for the Results step only", () => {
    expect(warningsForStep([noSupply], "results")).toEqual([noSupply]);
    for (const step of STEPS.filter((id) => id !== "results")) {
      expect(warningsForStep([noSupply], step)).toEqual([]);
    }
  });

  it("shows every other warning on every step, in order", () => {
    const warnings = [velocity, noSupply, "Safety margin is 4%"];
    for (const step of STEPS) {
      const shown = warningsForStep(warnings, step);
      expect(shown).toContain(velocity);
      expect(shown).toContain("Safety margin is 4%");
    }
    expect(warningsForStep(warnings, "supply")).toEqual([velocity, "Safety margin is 4%"]);
  });

  it("does not change what it is given", () => {
    const warnings = [noSupply, velocity];
    warningsForStep(warnings, "supply");
    expect(warnings).toEqual([noSupply, velocity]);
  });
});
