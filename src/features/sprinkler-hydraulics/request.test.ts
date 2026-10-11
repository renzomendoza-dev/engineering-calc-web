import { describe, expect, it } from "vitest";
import { sprinklerHydraulicsSchema, type SprinklerFormInput } from "./schema";
import {
  fittingNeedsExplicitLength,
  publishedFittingLength,
  toSprinklerRequest,
  unresolvedFittingPaths,
} from "./request";
import type { FittingEquivalentLengthTableRow } from "./types";

function formValues(overrides: Partial<SprinklerFormInput> = {}) {
  const input: SprinklerFormInput = {
    projectName: "  Warehouse A  ",
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
    quickResponseSprinklers: false,
    ceilingHeightFt: "",
    sprinklerSpacingFt: "",
    branchSpacingFt: "",
    supplySource: "FLOW_TEST",
    waterSupply: { staticPressurePsi: "80", residualPressurePsi: "60", flowAtResidualGpm: "1000" },
    gravityTank: { waterLevelHeightFt: "", outletRuns: [] },
    sprinklers: [{ nodeId: " S1 ", kFactor: "5.6", coverageAreaSqFt: "130" }],
    segments: [
      {
        fromNodeId: " S1 ",
        toNodeId: " B1 ",
        pipeMaterial: "BI",
        schedule: "SCH40",
        nominalSize: "1",
        cFactor: "120",
        pipeLengthFt: "10",
        elevationChangeFt: "0",
        fittings: [],
      },
    ],
    deviceLosses: [{ name: " Alarm valve ", pressureLossPsi: "5" }],
    hoseStreamNodeId: " RISER ",
    ...overrides,
  };
  return sprinklerHydraulicsSchema.parse(input);
}

const ELBOW_WITH_LENGTHS: FittingEquivalentLengthTableRow = {
  fittingType: "ELBOW_90_STANDARD",
  label: "90° elbow (standard)",
  confidence: "verified",
  equivalentLengthFtByNominalSize: { "1": 2, "2": 5 },
};

/** How every fitting is published today: listed, but with no lengths yet. */
const GATE_VALVE_UNPUBLISHED: FittingEquivalentLengthTableRow = {
  fittingType: "GATE_VALVE",
  label: "Gate valve",
  confidence: "placeholder",
  equivalentLengthFtByNominalSize: {},
};

describe("toSprinklerRequest", () => {
  it("sends exactly the API's fields, dropping the form-only ones", () => {
    const request = toSprinklerRequest(formValues());
    expect(Object.keys(request).sort()).toEqual(
      [
        "assumedStartPressurePsi",
        "densityGpmPerSqFt",
        "designAreaSqFt",
        "deviceLosses",
        "hazard",
        "hoseStreamGpm",
        "hoseStreamNodeId",
        "segments",
        "sprinklers",
        "systemType",
        "waterSupply",
      ].sort(),
    );
    expect(request).not.toHaveProperty("projectName");
    expect(request).not.toHaveProperty("defaultKFactor");
    expect(request).not.toHaveProperty("defaultCFactor");
    expect(request).not.toHaveProperty("defaultPipeMaterial");
    expect(request).not.toHaveProperty("defaultSchedule");
  });

  it("passes the hand-calculated case through unchanged, trimming node ids", () => {
    const request = toSprinklerRequest(formValues());
    expect(request).toMatchObject({
      systemType: "WET",
      hazard: "LIGHT",
      densityGpmPerSqFt: 0.1,
      designAreaSqFt: 1500,
      hoseStreamGpm: 100,
      hoseStreamNodeId: "RISER",
      assumedStartPressurePsi: 7,
      sprinklers: [{ nodeId: "S1", kFactor: 5.6, coverageAreaSqFt: 130 }],
      waterSupply: {
        source: "FLOW_TEST",
        flowTest: { staticPressurePsi: 80, residualPressurePsi: 60, flowAtResidualGpm: 1000 },
        gravityTank: null,
      },
      deviceLosses: [{ name: "Alarm valve", pressureLossPsi: 5 }],
    });
    expect(request.segments[0]).toMatchObject({
      fromNodeId: "S1",
      toNodeId: "B1",
      pipeMaterial: "BI",
      schedule: "SCH40",
      nominalSize: "1",
      cFactor: 120,
      pipeLengthFt: 10,
      elevationChangeFt: 0,
    });
  });

  it("sends the gravity tank block, and only that block, for a tank supply", () => {
    const request = toSprinklerRequest(
      formValues({
        supplySource: "GRAVITY_TANK",
        gravityTank: {
          waterLevelHeightFt: "80",
          outletRuns: [
            {
              pipeMaterial: "BI",
              schedule: "SCH40",
              nominalSize: "3",
              cFactor: "120",
              pipeLengthFt: "150",
              fittings: [],
            },
          ],
        },
      }),
    );

    expect(request.waterSupply).toEqual({
      source: "GRAVITY_TANK",
      flowTest: null,
      gravityTank: {
        waterLevelHeightFt: 80,
        outletRuns: [
          {
            pipeMaterial: "BI",
            schedule: "SCH40",
            nominalSize: "3",
            cFactor: 120,
            pipeLengthFt: 150,
            fittings: null,
          },
        ],
      },
    });
  });

  it("sends no supply at all for a source with no pressure of its own", () => {
    // A cistern or ground-level tank: the API answers with the demand and a null verdict.
    const request = toSprinklerRequest(formValues({ supplySource: "NONE" }));
    expect(request.waterSupply).toBeNull();
    // The demand side is untouched by the choice.
    expect(request.sprinklers).toHaveLength(1);
    expect(request.segments).toHaveLength(1);
  });

  it("omits an empty outlet run list rather than sending []", () => {
    const request = toSprinklerRequest(
      formValues({
        supplySource: "GRAVITY_TANK",
        gravityTank: { waterLevelHeightFt: "40", outletRuns: [] },
      }),
    );
    expect(request.waterSupply?.gravityTank?.outletRuns).toBeNull();
  });

  it("sends null, not an empty string, for an omitted hose stream node", () => {
    const request = toSprinklerRequest(formValues({ hoseStreamGpm: "0", hoseStreamNodeId: "  " }));
    expect(request.hoseStreamNodeId).toBeNull();
  });

  it("omits empty fitting and device lists the way the API documents", () => {
    const request = toSprinklerRequest(formValues({ deviceLosses: [] }));
    expect(request.deviceLosses).toBeNull();
    expect(request.segments[0].fittings).toBeNull();
  });

  it("sends a fitting's explicit length as null when it has a type instead", () => {
    const segments = formValues().segments.map((segment) => ({
      ...segment,
      fittings: [{ fittingType: "ELBOW_90_STANDARD", quantity: 2, explicitEquivalentLengthFt: undefined }],
    }));
    const request = toSprinklerRequest({ ...formValues(), segments });
    expect(request.segments[0].fittings).toEqual([
      { fittingType: "ELBOW_90_STANDARD", quantity: 2, explicitEquivalentLengthFt: null },
    ]);
  });

  it("produces a stable payload for unchanged input, so the live calculation doesn't repeat", () => {
    expect(JSON.stringify(toSprinklerRequest(formValues()))).toBe(
      JSON.stringify(toSprinklerRequest(formValues())),
    );
  });
});

describe("fitting equivalent lengths", () => {
  const table = [ELBOW_WITH_LENGTHS, GATE_VALVE_UNPUBLISHED];

  it("reads the published length for a fitting at a size", () => {
    expect(publishedFittingLength("ELBOW_90_STANDARD", "1", table)).toBe(2);
    expect(publishedFittingLength("ELBOW_90_STANDARD", "2", table)).toBe(5);
  });

  it("has no length for an unlisted size, an unpublished fitting, or no choice at all", () => {
    expect(publishedFittingLength("ELBOW_90_STANDARD", "6", table)).toBeUndefined();
    expect(publishedFittingLength("GATE_VALVE", "1", table)).toBeUndefined();
    expect(publishedFittingLength(undefined, "1", table)).toBeUndefined();
    expect(publishedFittingLength("ELBOW_90_STANDARD", undefined, table)).toBeUndefined();
  });

  it("asks for an explicit length exactly when the table can't supply one", () => {
    expect(fittingNeedsExplicitLength("ELBOW_90_STANDARD", "1", table)).toBe(false);
    expect(fittingNeedsExplicitLength("GATE_VALVE", "1", table)).toBe(true);
    expect(fittingNeedsExplicitLength("", "1", table)).toBe(true);
  });

  it("reports which fittings are still unresolved, so the request is held back", () => {
    const base = formValues();
    const segments = [
      {
        ...base.segments[0],
        fittings: [
          { fittingType: "ELBOW_90_STANDARD", quantity: 1, explicitEquivalentLengthFt: undefined },
          { fittingType: "GATE_VALVE", quantity: 1, explicitEquivalentLengthFt: undefined },
          { fittingType: "GATE_VALVE", quantity: 1, explicitEquivalentLengthFt: 3 },
        ],
      },
    ];
    expect(unresolvedFittingPaths({ ...base, segments }, table)).toEqual([
      "segments.0.fittings.1.explicitEquivalentLengthFt",
    ]);
  });

  it("treats everything as unresolved when the reference table failed to load", () => {
    const base = formValues();
    const segments = [
      {
        ...base.segments[0],
        fittings: [{ fittingType: "ELBOW_90_STANDARD", quantity: 1, explicitEquivalentLengthFt: undefined }],
      },
    ];
    expect(unresolvedFittingPaths({ ...base, segments }, [])).toEqual([
      "segments.0.fittings.0.explicitEquivalentLengthFt",
    ]);
  });
});
