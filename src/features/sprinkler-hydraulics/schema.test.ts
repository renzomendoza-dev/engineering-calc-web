import { describe, expect, it } from "vitest";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import { sprinklerHydraulicsSchema, STEPS, STEP_FIELDS, type SprinklerFormInput } from "./schema";

/**
 * The controller test's hand-calculated case, as the form holds it: numeric fields arrive from
 * NumberField as strings.
 */
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
    coveragePerSprinklerSqFt: "130",

    quickResponseSprinklers: false,
    ceilingHeightFt: "",
    sprinklerSpacingFt: "",
    supplySource: "FLOW_TEST",
    waterSupply: {
      staticPressurePsi: "80",
      residualPressurePsi: "60",
      flowAtResidualGpm: "1000",
    },
    gravityTank: { waterLevelHeightFt: "", outletRuns: [] },

    network: {
      branches: [
        {
          key: "branch-1",
          identicalToKey: "",
          sprinklers: [{ kFactor: "5.6", pipe: run({ nominalSize: "1", pipeLengthFt: "10" }) }],
          crossMain: run({ nominalSize: "2", pipeLengthFt: "20" }),
        },
      ],
      riser: [],
    },
    deviceLosses: [{ name: "Alarm valve", pressureLossPsi: "5" }],
    hoseStreamNodeId: "TOR",
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
    expect(values.network.branches[0].sprinklers[0].kFactor).toBe(5.6);
    expect(values.network.branches[0].sprinklers[0].pipe.pipeLengthFt).toBe(10);
    expect(values.network.branches[0].crossMain.pipeLengthFt).toBe(20);
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

  it("requires a hose stream point only when the allowance is non-zero", () => {
    expect(issuePaths(formInput({ hoseStreamNodeId: "" }))).toEqual(["hoseStreamNodeId"]);
    expect(issuePaths(formInput({ hoseStreamNodeId: "   " }))).toEqual(["hoseStreamNodeId"]);
  });

  it("only accepts a hose stream point that is on the riser as it stands", () => {
    const withRiser = (runs: number, node: string) =>
      issuePaths(
        formInput({
          network: {
            ...formInput().network,
            riser: Array.from({ length: runs }, () => run({ nominalSize: "4" })),
          },
          hoseStreamNodeId: node,
        }),
      );

    // No riser runs: the top of the riser is the supply connection, and it is the only point.
    expect(withRiser(0, "TOR")).toEqual([]);
    expect(withRiser(0, "BOR")).toEqual(["hoseStreamNodeId"]);
    // Two runs give a middle point; a point from a longer riser that has since been shortened
    // is refused rather than quietly sent to the API as an unknown node.
    expect(withRiser(2, "R2")).toEqual([]);
    expect(withRiser(2, "BOR")).toEqual([]);
    expect(withRiser(1, "R2")).toEqual(["hoseStreamNodeId"]);
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

  /**
   * REGRESSION: choosing a cistern left Next refusing to move, with no message.
   *
   * The form's defaults are deliberately 0 (so a fresh form can't fire a calculation), and a
   * per-field `.positive()` on the *inactive* supply block failed on those zeros -- on fields not
   * even on screen. The tests above use hand-filled blank strings, which sail through
   * optionalNumber, so they never exercised the real starting state. These start from
   * DEFAULT_SPRINKLER_FORM and fill in only what the user must measure on steps 1, 2 and 4.
   */
  describe("from the form's real defaults", () => {
    const filledNetwork: SprinklerFormInput = {
      ...DEFAULT_SPRINKLER_FORM,
      network: {
        ...DEFAULT_SPRINKLER_FORM.network,
        branches: [
          {
            ...DEFAULT_SPRINKLER_FORM.network.branches[0],
            sprinklers: [
              {
                ...DEFAULT_SPRINKLER_FORM.network.branches[0].sprinklers[0],
                pipe: { ...DEFAULT_SPRINKLER_FORM.network.branches[0].sprinklers[0].pipe, pipeLengthFt: 10 },
              },
            ],
            crossMain: { ...DEFAULT_SPRINKLER_FORM.network.branches[0].crossMain, pipeLengthFt: 20 },
          },
        ],
      },
    };

    it("is incomplete as shipped: the measured quantities are still zero", () => {
      expect(issuePaths(DEFAULT_SPRINKLER_FORM).length).toBeGreaterThan(0);
    });

    it("is valid with a cistern, even though both supply blocks still hold their default zeros", () => {
      expect(issuePaths({ ...filledNetwork, supplySource: "NONE" })).toEqual([]);
    });

    it("blocks a flow test until its own figures are entered, and not on the tank's zero height", () => {
      // A set, not a sequence: the default residual of 0 is fine on its own and is reported only
      // as "below static" once the zero static is known, which comes after the flow check.
      expect(issuePaths({ ...filledNetwork, supplySource: "FLOW_TEST" }).sort()).toEqual([
        "waterSupply.flowAtResidualGpm",
        "waterSupply.residualPressurePsi",
        "waterSupply.staticPressurePsi",
      ]);

      expect(
        issuePaths({
          ...filledNetwork,
          supplySource: "FLOW_TEST",
          waterSupply: { staticPressurePsi: 80, residualPressurePsi: 60, flowAtResidualGpm: 1000 },
        }),
      ).toEqual([]);
    });

    it("blocks a gravity tank until its height is entered, and not on the flow test's zeros", () => {
      expect(issuePaths({ ...filledNetwork, supplySource: "GRAVITY_TANK" })).toEqual([
        "gravityTank.waterLevelHeightFt",
      ]);

      expect(
        issuePaths({
          ...filledNetwork,
          supplySource: "GRAVITY_TANK",
          gravityTank: { waterLevelHeightFt: 80, outletRuns: [] },
        }),
      ).toEqual([]);
    });

    it("does not validate a tank's pipe rows when the tank is not the source", () => {
      // A half-entered row left behind after switching away must not block a city main.
      const strandedRow = {
        pipeMaterial: "",
        schedule: "",
        nominalSize: "",
        cFactor: 0,
        pipeLengthFt: 0,
        fittings: [],
      };
      expect(
        issuePaths({
          ...filledNetwork,
          supplySource: "NONE",
          gravityTank: { waterLevelHeightFt: 0, outletRuns: [strandedRow] },
        }),
      ).toEqual([]);
    });
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

  describe("the network", () => {
    const sprinklerPipePath = "network.branches.0.sprinklers.0.pipe";

    it("allows a negative rise (the supply above the sprinklers)", () => {
      const network = formInput().network;
      const branch = network.branches[0];
      const crossMain = { ...branch.crossMain, elevationChangeFt: "-12" };
      expect(issuePaths(formInput({ network: { ...network, branches: [{ ...branch, crossMain }] } }))).toEqual([]);
    });

    it("needs at least one branch, and a sprinkler on every branch", () => {
      const network = formInput().network;
      expect(issuePaths(formInput({ network: { ...network, branches: [] } }))).toEqual(["network.branches"]);
      expect(
        issuePaths(
          formInput({
            network: { ...network, branches: [{ ...network.branches[0], sprinklers: [] }] },
          }),
        ),
      ).toEqual(["network.branches.0.sprinklers"]);
    });

    it("lets the riser be empty: the cross main then ends at the supply", () => {
      expect(issuePaths(formInput())).toEqual([]);
    });

    it("makes a blank pipe length an error, not a silent zero", () => {
      // A new pipe starts blank on purpose: a default of 0 would calculate with a zero-length
      // pipe and give a plausible, wrong, answer.
      const network = formInput().network;
      const branch = network.branches[0];
      const blank = { ...branch.sprinklers[0], pipe: { ...branch.sprinklers[0].pipe, pipeLengthFt: "" } };
      expect(
        issuePaths(formInput({ network: { ...network, branches: [{ ...branch, sprinklers: [blank] }] } })),
      ).toEqual([`${sprinklerPipePath}.pipeLengthFt`]);
    });

    it("reports a pipe's error at that pipe's own path, wherever in the network it is", () => {
      const network = formInput().network;
      const bad = run({ pipeLengthFt: "-1" });
      expect(
        issuePaths(formInput({ network: { ...network, riser: [bad] }, hoseStreamNodeId: "TOR" })),
      ).toEqual(["network.riser.0.pipeLengthFt"]);
      expect(
        issuePaths(
          formInput({
            network: {
              ...network,
              branches: [{ ...network.branches[0], crossMain: bad }],
            },
          }),
        ),
      ).toEqual(["network.branches.0.crossMain.pipeLengthFt"]);
    });

    describe("fittings", () => {
      const withFitting = (fitting: Record<string, unknown>) => {
        const network = formInput().network;
        const branch = network.branches[0];
        const sprinkler = { ...branch.sprinklers[0], pipe: run({ fittings: [fitting] }) };
        return issuePaths(formInput({ network: { ...network, branches: [{ ...branch, sprinklers: [sprinkler] }] } }));
      };

      it("requires a fitting to have either a type or an explicit equivalent length", () => {
        expect(withFitting({ fittingType: "", quantity: "1", explicitEquivalentLengthFt: "" })).toEqual([
          `${sprinklerPipePath}.fittings.0.explicitEquivalentLengthFt`,
        ]);
        expect(
          withFitting({ fittingType: "ELBOW_90_STANDARD", quantity: "2", explicitEquivalentLengthFt: "" }),
        ).toEqual([]);
        expect(withFitting({ fittingType: "", quantity: "2", explicitEquivalentLengthFt: "5" })).toEqual([]);
      });

      it("requires a whole, positive quantity", () => {
        expect(
          withFitting({ fittingType: "ELBOW_90_STANDARD", quantity: "1.5", explicitEquivalentLengthFt: "" }),
        ).toEqual([`${sprinklerPipePath}.fittings.0.quantity`]);
      });
    });
  });

  describe("identical branches", () => {
    const base = () => formInput().network.branches[0];
    const second = (overrides: Record<string, unknown> = {}) => ({
      key: "branch-2",
      identicalToKey: "branch-1",
      sprinklers: base().sprinklers,
      crossMain: run({ nominalSize: "2", pipeLengthFt: "15" }),
      ...overrides,
    });
    const withBranches = (...branches: Record<string, unknown>[]) =>
      formInput({ network: { branches: [base(), ...branches] as never, riser: [] } });

    it("accepts a branch declared identical to the one before it", () => {
      expect(issuePaths(withBranches(second()))).toEqual([]);
    });

    it("does not read the sprinklers an identical branch still holds, however unfinished", () => {
      // Blank lengths and no K: fine, because the branch is not listed and they are not read.
      const unfinished = [{ kFactor: "", pipe: run({ pipeLengthFt: "" }) }];
      expect(issuePaths(withBranches(second({ sprinklers: unfinished })))).toEqual([]);
      expect(issuePaths(withBranches(second({ sprinklers: [] })))).toEqual([]);
    });

    it("gives the same unfinished sprinklers their errors once the branch is listed again", () => {
      const unfinished = [{ kFactor: "5.6", pipe: run({ pipeLengthFt: "" }) }];
      expect(issuePaths(withBranches(second({ identicalToKey: "", sprinklers: unfinished })))).toEqual([
        "network.branches.1.sprinklers.0.pipe.pipeLengthFt",
      ]);
    });

    it("still needs the copy's own cross main, which is its own distance", () => {
      const crossMain = run({ nominalSize: "2", pipeLengthFt: "" });
      expect(issuePaths(withBranches(second({ crossMain })))).toEqual([
        "network.branches.1.crossMain.pipeLengthFt",
      ]);
    });

    it("needs a sprinkler on a branch that is listed, but not on one that is a copy", () => {
      expect(issuePaths(withBranches(second({ identicalToKey: "", sprinklers: [] })))).toEqual([
        "network.branches.1.sprinklers",
      ]);
    });

    it("gives the first branch nothing to repeat", () => {
      const network = formInput().network;
      const first = { ...network.branches[0], identicalToKey: "branch-1" };
      expect(issuePaths(formInput({ network: { ...network, branches: [first] } }))).toEqual([
        "network.branches.0.identicalToKey",
      ]);
    });

    it("says so when the branch it repeated has been removed, rather than pointing elsewhere", () => {
      expect(issuePaths(withBranches(second({ identicalToKey: "removed-branch" })))).toEqual([
        "network.branches.1.identicalToKey",
      ]);
    });

    it("refuses a branch that repeats one that comes later", () => {
      const early = second({ key: "x", identicalToKey: "y" });
      const late = { ...base(), key: "y" };
      const network = { branches: [base(), early, late] as never, riser: [] };
      expect(issuePaths(formInput({ network }))).toEqual(["network.branches.1.identicalToKey"]);
    });

    it("refuses a copy of a copy: the reference has to be a branch that is listed in full", () => {
      const copyOfFirst = second({ key: "branch-2", identicalToKey: "branch-1" });
      const copyOfCopy = second({ key: "branch-3", identicalToKey: "branch-2" });
      expect(issuePaths(withBranches(copyOfFirst, copyOfCopy))).toEqual([
        "network.branches.2.identicalToKey",
      ]);
    });
  });

  describe("the fittings total", () => {
    const crossMainWith = (overrides: Record<string, unknown>) => {
      const network = formInput().network;
      const branch = network.branches[0];
      return formInput({
        network: {
          ...network,
          branches: [{ ...branch, crossMain: { ...branch.crossMain, ...overrides } }],
        },
      });
    };

    it("is optional: a pipe with nothing entered is complete", () => {
      expect(issuePaths(crossMainWith({ fittingsTotalFt: "", fittingsLabel: "" }))).toEqual([]);
      expect(issuePaths(crossMainWith({}))).toEqual([]);
    });

    it("takes a figure with or without a label, including zero", () => {
      expect(issuePaths(crossMainWith({ fittingsTotalFt: "13", fittingsLabel: "2E 1GV" }))).toEqual([]);
      expect(issuePaths(crossMainWith({ fittingsTotalFt: "13" }))).toEqual([]);
      expect(issuePaths(crossMainWith({ fittingsTotalFt: "0" }))).toEqual([]);
    });

    it("cannot be negative, and says so on its own field", () => {
      expect(issuePaths(crossMainWith({ fittingsTotalFt: "-4" }))).toEqual([
        "network.branches.0.crossMain.fittingsTotalFt",
      ]);
    });

    it("reaches the parsed values as a number", () => {
      const values = sprinklerHydraulicsSchema.parse(crossMainWith({ fittingsTotalFt: "13" }));
      expect(values.network.branches[0].crossMain.fittingsTotalFt).toBe(13);
    });
  });

  it("covers every form field across the steps exactly once", () => {
    const listed = STEPS.flatMap((step) => STEP_FIELDS[step]);
    expect(new Set(listed).size).toBe(listed.length);
    // Every key the schema parses is reachable from some step, or its errors would be invisible.
    expect(new Set(listed)).toEqual(new Set(Object.keys(formInput()) as (keyof SprinklerFormInput)[]));
  });
});
