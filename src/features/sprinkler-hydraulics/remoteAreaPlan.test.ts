import { describe, expect, it } from "vitest";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import { buildRemoteAreaPlanPayload } from "./remoteAreaPlan";
import { STEPS, STEP_LABELS, stepNumber, type SprinklerFormInput } from "./schema";
import type { RemoteAreaPlanRequest } from "./types";

/** The Light Hazard defaults, with the figures the plan needs measured and entered. */
function form(overrides: Partial<SprinklerFormInput> = {}): SprinklerFormInput {
  return {
    ...DEFAULT_SPRINKLER_FORM,
    sprinklerSpacingFt: "10",
    branchSpacingFt: "10",
    ...overrides,
  };
}

function request(values: SprinklerFormInput, maxCoverage: number | null = 225): RemoteAreaPlanRequest | null {
  const payload = buildRemoteAreaPlanPayload(values, maxCoverage);
  return payload === null ? null : (JSON.parse(payload) as RemoteAreaPlanRequest);
}

describe("buildRemoteAreaPlanPayload", () => {
  it("maps the form's step 1-3 figures onto the plan request", () => {
    expect(request(form())).toEqual({
      designAreaSqFt: 1500,
      densityGpmPerSqFt: 0.1,
      kFactor: 5.6,
      sprinklerSpacingFt: 10,
      branchSpacingFt: 10,
      quickResponseSprinklers: false,
      ceilingHeightFt: null,
      maxCoveragePerSprinklerSqFt: 225,
    });
  });

  it("takes K from the default K factor, which is the K new sprinklers start from", () => {
    expect(request(form({ defaultKFactor: "8.0" }))?.kFactor).toBe(8);
  });

  it("does not wait for the pipe network, the supply, or anything else not entered yet", () => {
    // The default form has a network of zeros and a supply of zeros -- all invalid for the
    // hydraulic calculation, and none of them the plan's business.
    expect(request(form())).not.toBeNull();
  });

  it("does not compute until both spacings are entered", () => {
    expect(request(form({ sprinklerSpacingFt: "" }))).toBeNull();
    expect(request(form({ branchSpacingFt: "" }))).toBeNull();
    expect(request(DEFAULT_SPRINKLER_FORM)).toBeNull();
  });

  it("rejects spacing that is not a positive number", () => {
    expect(request(form({ sprinklerSpacingFt: "0" }))).toBeNull();
    expect(request(form({ branchSpacingFt: "-4" }))).toBeNull();
  });

  it("needs a ceiling height once quick-response is ticked, and sends it", () => {
    expect(request(form({ quickResponseSprinklers: true, ceilingHeightFt: "" }))).toBeNull();
    expect(request(form({ quickResponseSprinklers: true, ceilingHeightFt: "0" }))).toBeNull();

    const sent = request(form({ quickResponseSprinklers: true, ceilingHeightFt: "15" }));
    expect(sent?.quickResponseSprinklers).toBe(true);
    expect(sent?.ceilingHeightFt).toBe(15);
  });

  it("drops a leftover ceiling height once quick-response is unticked", () => {
    // Someone ticks the box, types a height, then unticks it: the figure must not travel.
    const sent = request(form({ quickResponseSprinklers: false, ceilingHeightFt: "15" }));
    expect(sent?.ceilingHeightFt).toBeNull();
  });

  it("sends no coverage limit while the preset table has not loaded", () => {
    expect(request(form(), null)?.maxCoveragePerSprinklerSqFt).toBeNull();
  });

  it("is byte-identical for unchanged input, so the live request does not repeat", () => {
    expect(buildRemoteAreaPlanPayload(form(), 225)).toBe(buildRemoteAreaPlanPayload(form(), 225));
  });
});

describe("step numbering", () => {
  it("counts from one, in the order of STEPS", () => {
    STEPS.forEach((step, index) => expect(stepNumber(step)).toBe(index + 1));
  });

  it("puts the remote area plan after the K factor it reads and before the network that uses it", () => {
    expect(stepNumber("design")).toBeLessThan(stepNumber("remote"));
    expect(stepNumber("remote")).toBeLessThan(stepNumber("network"));
    expect(STEP_LABELS.remote).toBe("Remote area");
  });
});
