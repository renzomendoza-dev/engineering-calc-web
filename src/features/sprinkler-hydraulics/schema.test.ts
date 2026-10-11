import { describe, expect, it } from "vitest";
import { sprinklerHydraulicsSchema, STEPS, STEP_FIELDS, type SprinklerFormInput } from "./schema";

/**
 * The controller test's hand-calculated case, as the form holds it: numeric fields arrive from
 * NumberField as strings.
 */
function formInput(overrides: Partial<SprinklerFormInput> = {}): SprinklerFormInput {
  return {
    projectName: "Warehouse A",
    systemType: "WET",
    hazard: "LIGHT",
    densityGpmPerSqFt: "0.10",
    designAreaSqFt: "1500",
    hoseStreamGpm: "100",

    defaultKFactor: "5.6",
    defaultPipeMaterial: "BI",
    defaultSchedule: "SCH40",
    defaultCFactor: "120",
    assumedStartPressurePsi: "7",

    supplySource: "FLOW_TEST",
    waterSupply: {
      staticPressurePsi: "80",
      residualPressurePsi: "60",
      flowAtResidualGpm: "1000",
    },
    gravityTank: { waterLevelHeightFt: "", outletRuns: [] },

    sprinklers: [{ nodeId: "S1", kFactor: "5.6", coverageAreaSqFt: "130" }],
    segments: [
      {
        fromNodeId: "S1",
        toNodeId: "RISER",
        pipeMaterial: "BI",
        schedule: "SCH40",
        nominalSize: "1",
        cFactor: "120",
        pipeLengthFt: "10",
        elevationChangeFt: "0",
        fittings: [],
      },
    ],
    deviceLosses: [{ name: "Alarm valve", pressureLossPsi: "5" }],
    hoseStreamNodeId: "RISER",
    ...overrides,
  };
}

function issuePaths(input: SprinklerFormInput): string[] {
  const result = sprinklerHydraulicsSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("sprinklerHydraulicsSchema", () => {
  it("accepts the hand-calculated case and coerces the numbers", () => {
    const values = sprinklerHydraulicsSchema.parse(formInput());
    expect(values.densityGpmPerSqFt).toBe(0.1);
    expect(values.designAreaSqFt).toBe(1500);
    expect(values.waterSupply.flowAtResidualGpm).toBe(1000);
    expect(values.sprinklers[0].kFactor).toBe(5.6);
    expect(values.segments[0].pipeLengthFt).toBe(10);
    expect(values.deviceLosses[0].pressureLossPsi).toBe(5);
  });

  it("requires positive design figures, and allows a zero hose stream allowance", () => {
    expect(issuePaths(formInput({ densityGpmPerSqFt: "0", designAreaSqFt: "0" }))).toEqual([
      "densityGpmPerSqFt",
      "designAreaSqFt",
    ]);
    expect(issuePaths(formInput({ hoseStreamGpm: "-1" }))).toEqual(["hoseStreamGpm"]);
    expect(issuePaths(formInput({ hoseStreamGpm: "0", hoseStreamNodeId: "" }))).toEqual([]);
  });

  it("requires a hose stream node only when the allowance is non-zero", () => {
    expect(issuePaths(formInput({ hoseStreamNodeId: "" }))).toEqual(["hoseStreamNodeId"]);
    expect(issuePaths(formInput({ hoseStreamNodeId: "   " }))).toEqual(["hoseStreamNodeId"]);
  });

  it("requires the residual pressure to sit below the static pressure", () => {
    const supply = { staticPressurePsi: "80", flowAtResidualGpm: "1000" };
    expect(issuePaths(formInput({ waterSupply: { ...supply, residualPressurePsi: "80" } }))).toEqual([
      "waterSupply.residualPressurePsi",
    ]);
    expect(issuePaths(formInput({ waterSupply: { ...supply, residualPressurePsi: "90" } }))).toEqual([
      "waterSupply.residualPressurePsi",
    ]);
    expect(issuePaths(formInput({ waterSupply: { ...supply, residualPressurePsi: "0" } }))).toEqual([]);
  });

  describe("water supply source", () => {
    const blankFlowTest = { staticPressurePsi: "", residualPressurePsi: "", flowAtResidualGpm: "" };

    it("requires the flow test figures only for a flow-tested source", () => {
      expect(issuePaths(formInput({ supplySource: "FLOW_TEST", waterSupply: blankFlowTest }))).toEqual([
        "waterSupply.staticPressurePsi",
        "waterSupply.residualPressurePsi",
        "waterSupply.flowAtResidualGpm",
      ]);
    });

    it("requires a tank height only for a gravity tank, and ignores the flow test fields", () => {
      expect(
        issuePaths(
          formInput({
            supplySource: "GRAVITY_TANK",
            waterSupply: blankFlowTest,
            gravityTank: { waterLevelHeightFt: "", outletRuns: [] },
          }),
        ),
      ).toEqual(["gravityTank.waterLevelHeightFt"]);

      expect(
        issuePaths(
          formInput({
            supplySource: "GRAVITY_TANK",
            waterSupply: blankFlowTest,
            gravityTank: { waterLevelHeightFt: "80", outletRuns: [] },
          }),
        ),
      ).toEqual([]);
    });

    it("requires neither block when there is no supply", () => {
      // A cistern awaiting a pump: the demand is still a complete, valid calculation.
      expect(
        issuePaths(
          formInput({
            supplySource: "NONE",
            waterSupply: blankFlowTest,
            gravityTank: { waterLevelHeightFt: "", outletRuns: [] },
          }),
        ),
      ).toEqual([]);
    });

    it("applies the residual-below-static rule only to a flow test", () => {
      const inverted = { staticPressurePsi: "60", residualPressurePsi: "80", flowAtResidualGpm: "1000" };
      expect(issuePaths(formInput({ supplySource: "FLOW_TEST", waterSupply: inverted }))).toEqual([
        "waterSupply.residualPressurePsi",
      ]);
      expect(
        issuePaths(
          formInput({
            supplySource: "NONE",
            waterSupply: inverted,
          }),
        ),
      ).toEqual([]);
    });

    it("validates a tank's outlet runs like any other pipe", () => {
      expect(
        issuePaths(
          formInput({
            supplySource: "GRAVITY_TANK",
            gravityTank: {
              waterLevelHeightFt: "80",
              outletRuns: [
                { pipeMaterial: "", schedule: "SCH40", nominalSize: "", cFactor: "0", pipeLengthFt: "-1", fittings: [] },
              ],
            },
          }),
        ),
      ).toEqual([
        "gravityTank.outletRuns.0.pipeMaterial",
        "gravityTank.outletRuns.0.nominalSize",
        "gravityTank.outletRuns.0.cFactor",
        "gravityTank.outletRuns.0.pipeLengthFt",
      ]);
    });
  });

  it("rejects a segment that starts and ends at the same node", () => {
    const [segment] = formInput().segments;
    expect(issuePaths(formInput({ segments: [{ ...segment, toNodeId: "S1" }] }))).toEqual([
      "segments.0.toNodeId",
    ]);
  });

  it("allows a negative elevation change (the supply above the sprinklers)", () => {
    const [segment] = formInput().segments;
    expect(issuePaths(formInput({ segments: [{ ...segment, elevationChangeFt: "-12" }] }))).toEqual([]);
  });

  it("needs at least one sprinkler and one segment", () => {
    expect(issuePaths(formInput({ sprinklers: [] }))).toEqual(["sprinklers"]);
    expect(issuePaths(formInput({ segments: [] }))).toEqual(["segments"]);
  });

  it("requires a fitting to have either a type or an explicit equivalent length", () => {
    const [segment] = formInput().segments;
    const withFitting = (fitting: Record<string, unknown>) =>
      issuePaths(formInput({ segments: [{ ...segment, fittings: [fitting as never] }] }));

    expect(withFitting({ fittingType: "", quantity: "1", explicitEquivalentLengthFt: "" })).toEqual([
      "segments.0.fittings.0.explicitEquivalentLengthFt",
    ]);
    expect(
      withFitting({ fittingType: "ELBOW_90_STANDARD", quantity: "2", explicitEquivalentLengthFt: "" }),
    ).toEqual([]);
    expect(withFitting({ fittingType: "", quantity: "2", explicitEquivalentLengthFt: "5" })).toEqual([]);
  });

  it("requires a whole, positive fitting quantity", () => {
    const [segment] = formInput().segments;
    const fittings = [{ fittingType: "ELBOW_90_STANDARD", quantity: "1.5", explicitEquivalentLengthFt: "" }];
    expect(issuePaths(formInput({ segments: [{ ...segment, fittings: fittings as never }] }))).toEqual([
      "segments.0.fittings.0.quantity",
    ]);
  });

  it("does not reject a looped network — the API reports network shape", () => {
    const [segment] = formInput().segments;
    const loop = [
      { ...segment, fromNodeId: "S1", toNodeId: "B1" },
      { ...segment, fromNodeId: "B1", toNodeId: "S1" },
    ];
    expect(issuePaths(formInput({ segments: loop }))).toEqual([]);
  });

  it("covers every form field across the steps exactly once", () => {
    const listed = STEPS.flatMap((step) => STEP_FIELDS[step]);
    expect(new Set(listed).size).toBe(listed.length);
    // Every key the schema parses is reachable from some step, or its errors would be invisible.
    expect(new Set(listed)).toEqual(new Set(Object.keys(formInput()) as (keyof SprinklerFormInput)[]));
  });
});
