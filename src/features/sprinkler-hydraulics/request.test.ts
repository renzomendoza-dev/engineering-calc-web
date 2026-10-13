import { describe, expect, it } from "vitest";
import { sprinklerHydraulicsSchema, type SprinklerFormInput } from "./schema";
import {
  fittingNeedsExplicitLength,
  publishedFittingLength,
  toSprinklerRequest,
  unresolvedFittingPaths,
} from "./request";
import type { FittingEquivalentLengthTableRow } from "./types";

/** One run of pipe as the form holds it: numbers arrive from NumberField as strings. */
function run(overrides: Record<string, unknown> = {}) {
  return {
    pipeMaterial: "BI",
    schedule: "SCH40",
    nominalSize: "1",
    cFactor: "120",
    pipeLengthFt: "10",
    elevationChangeFt: "0",
    fittings: [] as { fittingType?: string; quantity: unknown; explicitEquivalentLengthFt?: unknown }[],
    ...overrides,
  };
}

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
    coveragePerSprinklerSqFt: "130",
    quickResponseSprinklers: false,
    ceilingHeightFt: "",
    sprinklerSpacingFt: "",
    supplySource: "FLOW_TEST",
    waterSupply: { staticPressurePsi: "80", residualPressurePsi: "60", flowAtResidualGpm: "1000" },
    gravityTank: { waterLevelHeightFt: "", outletRuns: [] },
    network: {
      branches: [
        {
          key: "branch-1",
          identicalToKey: "",
          sprinklers: [{ kFactor: "5.6", pipe: run() }],
          crossMain: run({ nominalSize: "2", pipeLengthFt: "20" }),
        },
      ],
      riser: [],
    },
    deviceLosses: [{ name: " Alarm valve ", pressureLossPsi: "5" }],
    hoseStreamNodeId: " TOR ",
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
        "identicalBranches",
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

  it("passes the hand-calculated case through unchanged, trimming the hose stream point", () => {
    const request = toSprinklerRequest(formValues());
    expect(request).toMatchObject({
      systemType: "WET",
      hazard: "LIGHT",
      densityGpmPerSqFt: 0.1,
      designAreaSqFt: 1500,
      hoseStreamGpm: 100,
      hoseStreamNodeId: "TOR",
      // Not asked for: the API works the start out from the design flow and the minimum pressure.
      assumedStartPressurePsi: null,
      // Coverage comes from step 1 and is applied to every sprinkler.
      sprinklers: [{ nodeId: "BL1-S1", kFactor: 5.6, coverageAreaSqFt: 130 }],
      waterSupply: {
        source: "FLOW_TEST",
        flowTest: { staticPressurePsi: 80, residualPressurePsi: 60, flowAtResidualGpm: 1000 },
        gravityTank: null,
      },
      deviceLosses: [{ name: "Alarm valve", pressureLossPsi: 5 }],
    });
    // The sprinkler's own pipe runs to the end of its branch, then the cross main to the riser.
    expect(request.segments).toHaveLength(2);
    expect(request.segments[0]).toMatchObject({
      fromNodeId: "BL1-S1",
      toNodeId: "A",
      pipeMaterial: "BI",
      schedule: "SCH40",
      nominalSize: "1",
      cFactor: 120,
      pipeLengthFt: 10,
      elevationChangeFt: 0,
    });
    expect(request.segments[1]).toMatchObject({
      fromNodeId: "A",
      toNodeId: "TOR",
      nominalSize: "2",
      pipeLengthFt: 20,
    });
  });

  describe("the network is built from the branches", () => {
    let counter = 0;
    const branch = (sprinklerCount: number, crossMainFt: string) => ({
      key: `branch-${(counter += 1)}`,
      identicalToKey: "",
      sprinklers: Array.from({ length: sprinklerCount }, () => ({ kFactor: "5.6", pipe: run() })),
      crossMain: run({ nominalSize: "2", pipeLengthFt: crossMainFt }),
    });

    it("lists every sprinkler once, in branch order, each with the coverage from step 1", () => {
      const request = toSprinklerRequest(
        formValues({ network: { branches: [branch(2, "12"), branch(3, "15")], riser: [] } }),
      );

      expect(request.sprinklers.map((s) => s.nodeId)).toEqual([
        "BL1-S1",
        "BL1-S2",
        "BL2-S1",
        "BL2-S2",
        "BL2-S3",
      ]);
      expect(request.sprinklers.every((s) => s.coverageAreaSqFt === 130)).toBe(true);
    });

    it("gives every pipe its own length, so branches can sit at different distances", () => {
      const request = toSprinklerRequest(
        formValues({
          network: { branches: [branch(1, "12"), branch(1, "15"), branch(1, "9")], riser: [] },
        }),
      );
      const crossMains = request.segments.filter((s) => s.nominalSize === "2");

      expect(crossMains.map((s) => [s.fromNodeId, s.toNodeId, s.pipeLengthFt])).toEqual([
        ["A", "B", 12],
        ["B", "C", 15],
        ["C", "TOR", 9],
      ]);
    });

    it("sends no identical branches, as null, when every branch is listed in full", () => {
      const request = toSprinklerRequest(
        formValues({ network: { branches: [branch(2, "12"), branch(2, "15")], riser: [] } }),
      );

      expect(request.identicalBranches).toBeNull();
    });

    it("declares an identical branch instead of listing it, and still lists its cross main", () => {
      const listed = branch(4, "18");
      const copy = {
        ...branch(0, "18"),
        key: "copy",
        identicalToKey: listed.key,
        // Held by the form, hidden, and not sent.
        sprinklers: [{ kFactor: "5.6", pipe: run() }],
      };
      const request = toSprinklerRequest(formValues({ network: { branches: [listed, copy], riser: [] } }));

      expect(request.identicalBranches).toEqual([{ joinNodeId: "B", referenceNodeId: "BL1-S4" }]);
      expect(request.sprinklers.map((s) => s.nodeId)).toEqual(["BL1-S1", "BL1-S2", "BL1-S3", "BL1-S4"]);
      expect(request.segments.map((s) => `${s.fromNodeId}->${s.toNodeId}`)).toContain("B->TOR");
    });

    it("continues down the riser from the top, and adds the hose stream on it", () => {
      const request = toSprinklerRequest(
        formValues({
          network: {
            branches: [branch(1, "12")],
            riser: [run({ nominalSize: "4", pipeLengthFt: "8" }), run({ nominalSize: "6", pipeLengthFt: "30" })],
          },
          hoseStreamNodeId: "R2",
        }),
      );
      const riser = request.segments.filter((s) => s.nominalSize === "4" || s.nominalSize === "6");

      expect(riser.map((s) => `${s.fromNodeId}->${s.toNodeId}`)).toEqual(["TOR->R2", "R2->BOR"]);
      expect(request.hoseStreamNodeId).toBe("R2");
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
    expect(request.segments).toHaveLength(2);
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
    const base = formValues();
    const [branch] = base.network.branches;
    const pipe = {
      ...branch.sprinklers[0].pipe,
      fittings: [{ fittingType: "ELBOW_90_STANDARD", quantity: 2, explicitEquivalentLengthFt: undefined }],
    };
    const network = { ...base.network, branches: [{ ...branch, sprinklers: [{ ...branch.sprinklers[0], pipe }] }] };
    const request = toSprinklerRequest({ ...base, network });
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
    const fittings = [
      { fittingType: "ELBOW_90_STANDARD", quantity: 1, explicitEquivalentLengthFt: undefined },
      { fittingType: "GATE_VALVE", quantity: 1, explicitEquivalentLengthFt: undefined },
      { fittingType: "GATE_VALVE", quantity: 1, explicitEquivalentLengthFt: 3 },
    ];
    const network = { ...base.network, riser: [{ ...base.network.branches[0].crossMain, fittings }] };
    expect(unresolvedFittingPaths({ ...base, network }, table)).toEqual([
      "network.riser.0.fittings.1.explicitEquivalentLengthFt",
    ]);
  });

  it("treats everything as unresolved when the reference table failed to load", () => {
    const base = formValues();
    const [branch] = base.network.branches;
    const fittings = [{ fittingType: "ELBOW_90_STANDARD", quantity: 1, explicitEquivalentLengthFt: undefined }];
    const network = {
      ...base.network,
      branches: [{ ...branch, crossMain: { ...branch.crossMain, fittings } }],
    };
    expect(unresolvedFittingPaths({ ...base, network }, [])).toEqual([
      "network.branches.0.crossMain.fittings.0.explicitEquivalentLengthFt",
    ]);
  });
});
