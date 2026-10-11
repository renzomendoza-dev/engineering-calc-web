import type { SprinklerFormInput } from "./schema";

/**
 * Starting point for a new calculation: the Light Hazard preset's design figures (so step 1 is
 * coherent before the reference table loads), a wet-system steel C factor, and one sprinkler on
 * one branch feeding a riser — the smallest network the API accepts.
 *
 * Quantities the designer must measure (coverage area, pipe lengths, the supply flow test) start
 * at 0 rather than a plausible-looking number, so nothing fabricated can slip into a result: 0
 * fails the schema, which keeps the live calculation from firing until they're filled in.
 */
export const DEFAULT_SPRINKLER_FORM: SprinklerFormInput = {
  projectName: "",
  systemType: "WET",
  hazard: "LIGHT",
  densityGpmPerSqFt: 0.1,
  designAreaSqFt: 1500,
  hoseStreamGpm: 100,

  defaultKFactor: 5.6,
  defaultPipeMaterial: "BI",
  defaultSchedule: "SCH40",
  defaultCFactor: 120,
  assumedStartPressurePsi: 7,

  // Remote area plan: nothing assumed. Spacing and ceiling height are measured, not defaulted, and
  // a blank plan simply doesn't compute -- it never blocks the hydraulic calculation.
  quickResponseSprinklers: false,
  ceilingHeightFt: "",
  sprinklerSpacingFt: "",
  branchSpacingFt: "",

  // A city main is the common case, so the form opens on it; the other sources are a click away.
  supplySource: "FLOW_TEST",
  waterSupply: {
    staticPressurePsi: 0,
    residualPressurePsi: 0,
    flowAtResidualGpm: 0,
  },
  gravityTank: {
    waterLevelHeightFt: 0,
    outletRuns: [],
  },

  sprinklers: [{ nodeId: "S1", kFactor: 5.6, coverageAreaSqFt: 0 }],
  segments: [
    {
      fromNodeId: "S1",
      toNodeId: "RISER",
      pipeMaterial: "BI",
      schedule: "SCH40",
      nominalSize: "1",
      cFactor: 120,
      pipeLengthFt: 0,
      elevationChangeFt: 0,
      fittings: [],
    },
  ],
  deviceLosses: [],
  hoseStreamNodeId: "RISER",
};

export const NEW_SPRINKLER_ROW = { nodeId: "", kFactor: 5.6, coverageAreaSqFt: 0 };
export const NEW_DEVICE_LOSS_ROW = { name: "", pressureLossPsi: 0 };
export const NEW_FITTING_ROW = { fittingType: "", quantity: 1, explicitEquivalentLengthFt: "" };
