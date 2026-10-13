import type { SprinklerFormInput } from "./schema";

/** One run of pipe as the form holds it, before any of it is parsed. */
export type PipeRunInput = SprinklerFormInput["network"]["branches"][number]["crossMain"];

/**
 * The most sprinklers a steel pipe size serves in the pipe schedule method (the classic
 * ordinary-hazard table: 1 in. - 2, 1-1/4 - 3, 1-1/2 - 5, 2 - 10, 2-1/2 - 20, 3 - 40).
 *
 * Used only to pick the size a new sprinkler's pipe starts at, so a branch steps up as it
 * gathers flow instead of every pipe starting at 1 in. and drawing a velocity warning at its end.
 * It is a starting point, not a design: the hydraulic calculation does not read it, every size
 * stays editable, and it is steel -- another material or schedule may not offer the size, in which
 * case the caller falls back. Check the figures against your copy of NFPA 13 before relying on
 * them as more than a default.
 */
const PIPE_SCHEDULE_SPRINKLERS: readonly { size: string; upTo: number }[] = [
  { size: "1", upTo: 2 },
  { size: "1-1/4", upTo: 3 },
  { size: "1-1/2", upTo: 5 },
  { size: "2", upTo: 10 },
  { size: "2-1/2", upTo: 20 },
  { size: "3", upTo: 40 },
];

/**
 * The nominal size a pipe starts at when it serves `sprinklerCount` sprinklers: the pipe after the
 * Nth sprinkler of a branch carries the flow of the N before it.
 */
export function sizeForSprinklerCount(sprinklerCount: number): string {
  const row = PIPE_SCHEDULE_SPRINKLERS.find((entry) => sprinklerCount <= entry.upTo);
  return (row ?? PIPE_SCHEDULE_SPRINKLERS[PIPE_SCHEDULE_SPRINKLERS.length - 1]).size;
}

/**
 * A fresh run of pipe. The length is blank on purpose (see DEFAULT_SPRINKLER_FORM): it has to be
 * typed. Material, schedule and C factor are what step 2 chose, passed in by the caller; the size
 * is the caller's too, since a branch pipe and a riser are different things.
 */
export function newPipeRun(overrides: Partial<PipeRunInput> = {}): PipeRunInput {
  return {
    pipeMaterial: "BI",
    schedule: "SCH40",
    nominalSize: "1",
    cFactor: 120,
    pipeLengthFt: "",
    elevationChangeFt: 0,
    fittings: [],
    ...overrides,
  };
}

/**
 * A key for a branch added after the form opened. Not derived from position -- that is the whole
 * point of it -- and not random at module load, so the server-rendered default and the client's
 * agree; the one branch the form opens with has a fixed key.
 */
export function newBranchKey(): string {
  return `branch-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Starting point for a new calculation: the Light Hazard preset's published figures (density, area,
 * hose stream and the largest coverage one sprinkler may have, so step 1 is coherent before the
 * reference table loads), a wet-system steel C factor, and one sprinkler on one branch feeding a
 * riser -- the smallest network the API accepts.
 *
 * Quantities the designer must measure (pipe lengths, the supply flow test, the spacing along a
 * branch) start at 0 or blank rather than a plausible-looking number, so nothing fabricated can
 * slip into a result: 0 fails the schema, which keeps the live calculation from firing until
 * they're filled in. The coverage per sprinkler is a published maximum, not a measurement, and is
 * shown in step 1 where it is meant to be replaced.
 */
export const DEFAULT_SPRINKLER_FORM: SprinklerFormInput = {
  projectName: "",
  systemType: "WET",
  hazard: "LIGHT",
  densityGpmPerSqFt: 0.1,
  designAreaSqFt: 1500,
  hoseStreamGpm: 100,
  // The Light Hazard preset's published maximum, like the density and area above it: a starting
  // point the designer replaces with their actual spacing, and refilled when the hazard changes.
  coveragePerSprinklerSqFt: 225,
  quickResponseSprinklers: false,
  ceilingHeightFt: "",

  defaultKFactor: 5.6,
  defaultPipeMaterial: "BI",
  defaultSchedule: "SCH40",
  defaultCFactor: 120,

  // Spacing along a branch is measured, not defaulted: blank means the layout isn't worked out
  // yet, and a blank layout never blocks the hydraulic calculation.
  sprinklerSpacingFt: "",

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

  // One branch of one sprinkler, its pipe, and the cross main from it: the smallest network there
  // is. Lengths start blank -- a pipe has a length, and a fresh form must not calculate on
  // lengths nobody entered.
  network: {
    branches: [
      {
        key: "branch-1",
        identicalToKey: "",
        sprinklers: [{ kFactor: 5.6, pipe: newPipeRun({ nominalSize: "1" }) }],
        crossMain: newPipeRun({ nominalSize: "2" }),
      },
    ],
    riser: [],
  },
  deviceLosses: [],
  // Added at the top of the riser, where the cross main arrives -- see network.ts.
  hoseStreamNodeId: "TOR",
};

export const NEW_DEVICE_LOSS_ROW = { name: "", pressureLossPsi: 0 };
export const NEW_FITTING_ROW = { fittingType: "", quantity: 1, explicitEquivalentLengthFt: "" };
