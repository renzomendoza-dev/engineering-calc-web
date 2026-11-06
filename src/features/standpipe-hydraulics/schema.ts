import { z } from "zod";
import { optionalNumber, requiredNumber } from "@/lib/zodHelpers";
import {
  COMBINED_HAZARDS,
  HOSE_CONNECTION_SIZES,
  PIPE_ROLES,
  SPRINKLER_PROTECTIONS,
  STANDPIPE_CLASSES,
} from "./types";

/**
 * One schema for the whole multi-step input. Steps validate subsets of it (see STEP_FIELDS).
 *
 * FORM-ONLY fields (request.ts drops them): the project name, and each segment's `key`, a stable
 * handle for the row. `hoseConnectionSize` blank means the segment has no hose connection;
 * `fittingType` "EXPLICIT" means the fitting is given as a length.
 *
 * The rules mirror the ones calc-core enforces so the obvious mistakes show before a request goes
 * out. calc-core stays the authority, and the NFPA 14 rules themselves (flows, residuals, sizes)
 * are applied there only: the page never decides what the standard requires.
 */
const positive = (typeMessage = "Must be a number") =>
  z.coerce.number(typeMessage).positive("Must be positive");

export const EXPLICIT_FITTING = "EXPLICIT";

const fittingSchema = z
  .object({
    fittingType: z.string(),
    quantity: z.coerce
      .number("Must be a number")
      .int("Must be a whole number")
      .positive("Must be positive"),
    explicitEquivalentLengthFt: optionalNumber(positive()),
  })
  .superRefine((fitting, ctx) => {
    if (fitting.fittingType === "") {
      ctx.addIssue({ code: "custom", path: ["fittingType"], message: "Choose a fitting" });
    }
    if (fitting.fittingType === EXPLICIT_FITTING && fitting.explicitEquivalentLengthFt === undefined) {
      ctx.addIssue({ code: "custom", path: ["explicitEquivalentLengthFt"], message: "Required" });
    }
  });

const segmentSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().trim().min(1, "Required"),
    role: z.enum(PIPE_ROLES),
    flowAddedGpm: optionalNumber(positive()),
    hoseConnectionSize: z.union([z.literal(""), z.enum(HOSE_CONNECTION_SIZES)]),
    pipeMaterial: z.string().min(1, "Required"),
    schedule: z.string().optional(),
    nominalSize: z.string().min(1, "Required"),
    cFactor: requiredNumber(positive("Required")),
    pipeLengthFt: requiredNumber(z.coerce.number("Required").min(0, "Cannot be negative")),
    elevationRiseFt: requiredNumber(z.coerce.number("Required")),
    fittings: z.array(fittingSchema),
  })
  .superRefine((segment, ctx) => {
    if (segment.hoseConnectionSize !== "" && segment.flowAddedGpm === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["flowAddedGpm"],
        message: "A hose connection needs its flow",
      });
    }
  });

export const standpipeHydraulicSchema = z
  .object({
    projectName: z.string(), // FORM-ONLY
    standpipeClass: z.enum(STANDPIPE_CLASSES),
    sprinklerProtection: z.enum(SPRINKLER_PROTECTIONS),
    sprinklerHazard: z.union([z.literal(""), z.enum(COMBINED_HAZARDS)]),
    sprinklerDemandGpm: optionalNumber(z.coerce.number("Must be a number").min(0, "Cannot be negative")),
    additionalStandpipes: requiredNumber(
      z.coerce.number("Required").int("Must be a whole number").min(0, "Cannot be negative"),
    ),
    floorAreaOver80000SqFt: z.boolean(),
    horizontalStandpipeOnThreeConnections: z.boolean(),
    fireDepartmentConnectionInlets: optionalNumber(
      z.coerce.number("Must be a number").int("Must be a whole number").min(0, "Cannot be negative"),
    ),
    supplyDurationMinutes: optionalNumber(positive()),
    flowAddedAtSupplyGpm: optionalNumber(z.coerce.number("Must be a number").min(0, "Cannot be negative")),
    segments: z.array(segmentSchema).min(1, "Add at least one pipe segment"),
  })
  .superRefine((input, ctx) => {
    if (
      input.sprinklerProtection === "PARTIAL" &&
      input.sprinklerDemandGpm !== undefined &&
      input.sprinklerHazard === ""
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sprinklerHazard"],
        message: "Choose light or ordinary for a partly sprinklered building",
      });
    }
    const labels = new Set<string>();
    input.segments.forEach((segment, index) => {
      const label = segment.label.trim();
      if (labels.has(label)) {
        ctx.addIssue({
          code: "custom",
          path: ["segments", index, "label"],
          message: "Another segment already has this name",
        });
      }
      labels.add(label);
    });
    if (!input.segments.some((segment) => segment.hoseConnectionSize !== "")) {
      ctx.addIssue({
        code: "custom",
        path: ["segments", 0, "hoseConnectionSize"],
        message: "At least one segment must have a hose connection",
      });
    }
  });

export type StandpipeFormInput = z.input<typeof standpipeHydraulicSchema>;
export type StandpipeFormValues = z.output<typeof standpipeHydraulicSchema>;
export type SegmentFormInput = StandpipeFormInput["segments"][number];
export type FittingFormInput = SegmentFormInput["fittings"][number];

export const STEPS = ["basis", "path", "results"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  basis: "Design basis",
  path: "Pipe path",
  results: "Results",
};

/** The fields each step owns: moving past a step validates exactly these. */
export const STEP_FIELDS: Record<StepId, string[]> = {
  basis: [
    "projectName",
    "standpipeClass",
    "sprinklerProtection",
    "sprinklerHazard",
    "sprinklerDemandGpm",
    "additionalStandpipes",
    "floorAreaOver80000SqFt",
    "horizontalStandpipeOnThreeConnections",
    "fireDepartmentConnectionInlets",
    "supplyDurationMinutes",
    "flowAddedAtSupplyGpm",
  ],
  path: ["segments"],
  results: [],
};
