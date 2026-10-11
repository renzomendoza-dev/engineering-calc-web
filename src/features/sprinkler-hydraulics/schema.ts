import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";
import { SPRINKLER_HAZARDS, SPRINKLER_SYSTEM_TYPES } from "./types";

/**
 * One schema for the whole five-step input. Steps validate subsets of it (see STEP_FIELDS) so
 * moving between steps never revalidates — or resets — fields the user hasn't reached yet.
 *
 * Fields the API doesn't take are marked FORM-ONLY below: the project name (labelling, and the
 * report slice later), and the design defaults that pre-fill new rows. request.ts drops them.
 *
 * The cross-field rules here mirror the ones calc-core enforces, so the obvious mistakes are
 * caught before a request goes out. calc-core stays the authority: network shape (the network must
 * be a tree) is NOT checked here — a looped network is reported by the API.
 */
const fittingSchema = z.object({
  fittingType: z.string().optional(),
  quantity: z.coerce.number().int("Must be a whole number").positive("Must be positive"),
  explicitEquivalentLengthFt: optionalNumber(z.coerce.number().positive("Must be positive")),
});

const segmentSchema = z.object({
  fromNodeId: z.string().min(1, "Required"),
  toNodeId: z.string().min(1, "Required"),
  pipeMaterial: z.string().min(1, "Required"),
  schedule: z.string().optional(),
  nominalSize: z.string().min(1, "Required"),
  cFactor: z.coerce.number().positive("Must be positive"),
  pipeLengthFt: z.coerce.number().min(0, "Cannot be negative"),
  elevationChangeFt: z.coerce.number(),
  fittings: z.array(fittingSchema),
});

const sprinklerRowSchema = z.object({
  nodeId: z.string().min(1, "Required"),
  kFactor: z.coerce.number().positive("Must be positive"),
  coverageAreaSqFt: z.coerce.number().positive("Must be positive"),
});

const deviceLossSchema = z.object({
  name: z.string().min(1, "Required"),
  pressureLossPsi: z.coerce.number().min(0, "Cannot be negative"),
});

export const sprinklerHydraulicsSchema = z
  .object({
    // --- step 1: project & hazard ---
    projectName: z.string().optional(), // FORM-ONLY
    systemType: z.enum(SPRINKLER_SYSTEM_TYPES, "System type is required"),
    hazard: z.enum(SPRINKLER_HAZARDS, "Hazard classification is required"),
    densityGpmPerSqFt: z.coerce.number().positive("Must be positive"),
    designAreaSqFt: z.coerce.number().positive("Must be positive"),
    hoseStreamGpm: z.coerce.number().min(0, "Cannot be negative"),

    // --- step 2: design data ---
    defaultKFactor: z.coerce.number().positive("Must be positive"), // FORM-ONLY (pre-fills rows)
    defaultPipeMaterial: z.string().min(1, "Pipe material is required"), // FORM-ONLY
    defaultSchedule: z.string().optional(), // FORM-ONLY
    defaultCFactor: z.coerce.number().positive("Must be positive"), // FORM-ONLY
    assumedStartPressurePsi: z.coerce.number().min(0, "Cannot be negative"),

    // --- step 3: water supply ---
    waterSupply: z.object({
      staticPressurePsi: z.coerce.number().positive("Must be positive"),
      residualPressurePsi: z.coerce.number().min(0, "Cannot be negative"),
      flowAtResidualGpm: z.coerce.number().positive("Must be positive"),
    }),

    // --- step 4: pipe network ---
    sprinklers: z.array(sprinklerRowSchema).min(1, "Add at least one flowing sprinkler"),
    segments: z.array(segmentSchema).min(1, "Add at least one pipe segment"),
    deviceLosses: z.array(deviceLossSchema),
    hoseStreamNodeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // calc-core requires the hose stream node whenever the allowance is non-zero.
    if (data.hoseStreamGpm > 0 && !data.hoseStreamNodeId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["hoseStreamNodeId"],
        message: "Required when a hose stream allowance is given",
      });
    }

    // calc-core's SupplyCurve requires the residual to sit below the static pressure.
    if (data.waterSupply.residualPressurePsi >= data.waterSupply.staticPressurePsi) {
      ctx.addIssue({
        code: "custom",
        path: ["waterSupply", "residualPressurePsi"],
        message: "Must be below the static pressure",
      });
    }

    data.segments.forEach((segment, index) => {
      if (segment.fromNodeId.trim() && segment.fromNodeId.trim() === segment.toNodeId.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["segments", index, "toNodeId"],
          message: "Must differ from the upstream node",
        });
      }
      // calc-core's SegmentFitting needs either a type to look up or an explicit length.
      segment.fittings.forEach((fitting, fittingIndex) => {
        if (!fitting.fittingType?.trim() && fitting.explicitEquivalentLengthFt === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["segments", index, "fittings", fittingIndex, "explicitEquivalentLengthFt"],
            message: "Choose a fitting type or enter an equivalent length",
          });
        }
      });
    });
  });

/** Pre-coercion shape react-hook-form edits (numeric fields arrive as strings). */
export type SprinklerFormInput = z.input<typeof sprinklerHydraulicsSchema>;

/** Post-coercion shape, the only thing request.ts maps from. */
export type SprinklerFormValues = z.output<typeof sprinklerHydraulicsSchema>;

export const STEPS = ["project", "design", "supply", "network", "results"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  project: "Project & hazard",
  design: "Design data",
  supply: "Water supply",
  network: "Pipe network",
  results: "Results",
};

/**
 * Which fields each step validates when moving forward. Results validates nothing of its own —
 * reaching it means every input step already passed.
 */
export const STEP_FIELDS: Record<StepId, readonly (keyof SprinklerFormInput)[]> = {
  project: ["projectName", "systemType", "hazard", "densityGpmPerSqFt", "designAreaSqFt", "hoseStreamGpm"],
  design: ["defaultKFactor", "defaultPipeMaterial", "defaultSchedule", "defaultCFactor", "assumedStartPressurePsi"],
  supply: ["waterSupply"],
  network: ["sprinklers", "segments", "deviceLosses", "hoseStreamNodeId"],
  results: [],
};
