import { describe, expect, it } from "vitest";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import { buildRemoteAreaPlanPayload } from "./remoteAreaPlan";
import { STEPS, STEP_FIELDS, STEP_LABELS, stepNumber, type SprinklerFormInput } from "./schema";
import type { RemoteAreaPlanRequest } from "./types";

/** The Light Hazard defaults, as a fresh form has them -- no spacing, no quick-response. */
function form(overrides: Partial<SprinklerFormInput> = {}): SprinklerFormInput {
  return { ...DEFAULT_SPRINKLER_FORM, ...overrides };
}

function request(values: SprinklerFormInput, maxCoverage: number | null = 225): RemoteAreaPlanRequest | null {
  const payload = buildRemoteAreaPlanPayload(values, maxCoverage);
  return payload === null ? null : (JSON.parse(payload) as RemoteAreaPlanRequest);
}

describe("buildRemoteAreaPlanPayload", () => {
  it("maps the design basis onto the plan request, with no spacing yet", () => {
    expect(request(form())).toEqual({
      designAreaSqFt: 1500,
      densityGpmPerSqFt: 0.1,
      kFactor: 5.6,
      coveragePerSprinklerSqFt: 225,
      sprinklerSpacingFt: null,
      quickResponseSprinklers: false,
      ceilingHeightFt: null,
      maxCoveragePerSprinklerSqFt: 225,
    });
  });

  it("is sendable from a fresh form, before any spacing is entered", () => {
    // Step 1 shows the area, flow per sprinkler and sprinkler count, and step 2 the starting
    // pressure. None of that may wait for the layout spacing.
    expect(request(DEFAULT_SPRINKLER_FORM)).not.toBeNull();
  });

  it("sends the spacing along the branch once it is entered", () => {
    expect(request(form({ sprinklerSpacingFt: "12" }))?.sprinklerSpacingFt).toBe(12);
  });

  it("treats a blank spacing as 'not laid out yet', and still computes", () => {
    expect(request(form({ sprinklerSpacingFt: "" }))?.sprinklerSpacingFt).toBeNull();
  });

  it("does not compute from a spacing that is not a positive number", () => {
    // A zero is a mistake to be shown, not a layout to be worked out from.
    expect(request(form({ sprinklerSpacingFt: "0" }))).toBeNull();
    expect(request(form({ sprinklerSpacingFt: "-4" }))).toBeNull();
  });

  it("takes K from the default K factor, which is the K new sprinklers start from", () => {
    expect(request(form({ defaultKFactor: "8.0" }))?.kFactor).toBe(8);
  });

  it("follows the coverage and density the user changes", () => {
    const sent = request(form({ coveragePerSprinklerSqFt: "130", densityGpmPerSqFt: "0.15" }));
    expect(sent?.coveragePerSprinklerSqFt).toBe(130);
    expect(sent?.densityGpmPerSqFt).toBe(0.15);
  });

  it("does not compute without a positive coverage", () => {
    expect(request(form({ coveragePerSprinklerSqFt: "" }))).toBeNull();
    expect(request(form({ coveragePerSprinklerSqFt: "0" }))).toBeNull();
  });

  it("does not wait for the pipe network, the supply, or anything else not entered yet", () => {
    // The default form has a network of zeros and a supply of zeros -- all invalid for the
    // hydraulic calculation, and none of them the plan's business.
    expect(request(form())).not.toBeNull();
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

describe("where the design basis is entered", () => {
  it("puts coverage, quick-response and ceiling height in step 1, with the other design figures", () => {
    expect(STEP_FIELDS.project).toEqual(
      expect.arrayContaining(["coveragePerSprinklerSqFt", "quickResponseSprinklers", "ceilingHeightFt"]),
    );
  });

  it("leaves step 2 with no starting-pressure input", () => {
    expect(STEP_FIELDS.design).not.toContain("assumedStartPressurePsi");
    expect(Object.keys(DEFAULT_SPRINKLER_FORM)).not.toContain("assumedStartPressurePsi");
  });

  it("asks for the spacing along the branch beside the network it lays out, not in a step of its own", () => {
    expect(STEP_FIELDS.network).toContain("sprinklerSpacingFt");
    expect(Object.keys(STEP_FIELDS)).not.toContain("remote");
    expect(Object.keys(DEFAULT_SPRINKLER_FORM)).not.toContain("branchSpacingFt");
  });
});

describe("step numbering", () => {
  it("counts from one, in the order of STEPS", () => {
    STEPS.forEach((step, index) => expect(stepNumber(step)).toBe(index + 1));
  });

  it("has five steps, with the pipe network after the water supply and before the results", () => {
    expect([...STEPS]).toEqual(["project", "design", "supply", "network", "results"]);
    expect(stepNumber("supply")).toBeLessThan(stepNumber("network"));
    expect(stepNumber("network")).toBeLessThan(stepNumber("results"));
    expect(STEP_LABELS.network).toBe("Pipe network");
  });
});
