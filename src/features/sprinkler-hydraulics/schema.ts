import { z } from "zod";
import { optionalNumber, requiredNumber } from "@/lib/zodHelpers";
import { pipeRuns, riserNodeIds } from "./network";
import { SPRINKLER_HAZARDS, SPRINKLER_SYSTEM_TYPES } from "./types";

/**
 * One schema for the whole multi-step input. Steps validate subsets of it (see STEP_FIELDS) so
 * moving between steps never revalidates — or resets — fields the user hasn't reached yet.
 *
 * Fields the API doesn't take are marked FORM-ONLY below: the project name (labelling, and the
 * report slice later), and the design defaults that pre-fill new rows. request.ts drops them.
 *
 * The cross-field rules here mirror the ones calc-core enforces, so the obvious mistakes are
 * caught before a request goes out. calc-core stays the authority: network shape (the network must
 * be a tree) is NOT checked here. It cannot be wrong by construction either way: the network is
 * entered as branches and the node ids are generated (network.ts), so a loop or a dangling node
 * is not something the form can produce.
 */
const fittingSchema = z.object({
  fittingType: z.string().optional(),
  quantity: z.coerce.number().int("Must be a whole number").positive("Must be positive"),
  explicitEquivalentLengthFt: optionalNumber(z.coerce.number().positive("Must be positive")),
});

/**
 * One run of pipe, with no idea where it connects: that is decided by where it sits in the network
 * (see network.ts), so there are no node ids to type or to get wrong.
 *
 * The length is required rather than defaulted to 0: a pipe has a length, 0 is a figure that must
 * be typed on purpose, and a fresh form must not calculate on lengths nobody entered.
 */
const pipeRunSchema = z.object({
  pipeMaterial: z.string().min(1, "Required"),
  schedule: z.string().optional(),
  nominalSize: z.string().min(1, "Required"),
  cFactor: z.coerce.number().positive("Must be positive"),
  pipeLengthFt: requiredNumber(z.coerce.number("Required").min(0, "Cannot be negative")),
  elevationChangeFt: z.coerce.number(),
  fittings: z.array(fittingSchema),
});

/** A sprinkler and the pipe after it -- the two are one thing, never entered separately. */
const branchSprinklerSchema = z.object({
  kFactor: z.coerce.number().positive("Must be positive"),
  pipe: pipeRunSchema,
});

/**
 * One branch line: its sprinklers from the most remote inwards, each with its pipe, then the cross
 * main that carries it on to the next branch (or to the riser, for the last).
 */
const branchSchema = z.object({
  sprinklers: z.array(branchSprinklerSchema).min(1, "A branch needs at least one sprinkler"),
  crossMain: pipeRunSchema,
});

const networkSchema = z.object({
  branches: z.array(branchSchema).min(1, "Add at least one branch"),
  riser: z.array(pipeRunSchema),
});

/**
 * A gravity tank's outlet piping: like a segment without the network or the elevation.
 *
 * Lenient on purpose. These rows belong to the gravity tank source, and a form set to a city main
 * or a cistern still carries them; strict row rules here would block a calculation over pipe that
 * is not part of it. The superRefine in sprinklerHydraulicsSchema applies the real rules, to these
 * rows only when GRAVITY_TANK is the chosen source.
 */
const supplyPipeRunSchema = z.object({
  pipeMaterial: z.string(),
  schedule: z.string().optional(),
  nominalSize: z.string(),
  cFactor: optionalNumber(z.coerce.number()),
  pipeLengthFt: optionalNumber(z.coerce.number()),
  fittings: z.array(fittingSchema),
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
    // The area one sprinkler protects, applied to every sprinkler in the pipe network. Required for
    // the hydraulic calculation, which takes density x coverage as each sprinkler's minimum flow.
    coveragePerSprinklerSqFt: z.coerce.number().positive("Must be positive"),
    // Ceiling height reduces the design area for quick-response sprinklers. FORM-ONLY, and lenient
    // on purpose: it feeds the plan's adjusted area, never the hydraulic request, so a blank or
    // half-finished figure must not stop the calculation. The plan simply doesn't reduce until the
    // ceiling is in -- the same lesson as the supply blocks below.
    quickResponseSprinklers: z.boolean(), // FORM-ONLY
    ceilingHeightFt: optionalNumber(z.coerce.number().positive("Must be positive")), // FORM-ONLY

    // --- step 2: design data ---
    defaultKFactor: z.coerce.number().positive("Must be positive"), // FORM-ONLY (pre-fills rows)
    defaultPipeMaterial: z.string().min(1, "Pipe material is required"), // FORM-ONLY
    defaultSchedule: z.string().optional(), // FORM-ONLY
    defaultCFactor: z.coerce.number().positive("Must be positive"), // FORM-ONLY
    // There is no starting pressure input. The most remote sprinkler starts at what its flow needs
    // -- (density x coverage / K)^2 -- or the minimum operating pressure, whichever is greater, and
    // the API works that out and says which governed.

    // --- step 3: remote area ---
    // Spacing ALONG a branch line, FORM-ONLY and lenient like the ceiling height: it only lays the
    // area out, and the spacing between branches follows from the coverage. Blank means the layout
    // isn't worked out yet, not that anything is wrong.
    sprinklerSpacingFt: optionalNumber(z.coerce.number().positive("Must be positive")), // FORM-ONLY

    // --- step 4: water supply ---
    // FORM-ONLY: picks which block below is sent. "NONE" sends no supply at all, which the API
    // answers with the demand figures and a null margin and verdict.
    supplySource: z.enum(["FLOW_TEST", "GRAVITY_TANK", "NONE"], "Choose where the water comes from"),
    // Both blocks are always present in the form, but only the chosen source's is real. So the
    // fields here accept any number (or blank), and the superRefine below applies the actual
    // rules -- required, positive, below static -- to the block that is in use and to nothing else.
    //
    // Constraining them here instead is what broke choosing a cistern: the form's defaults are
    // deliberately 0 (so a fresh form can't fire a calculation), and a `.positive()` on the
    // inactive block's 0 failed "Must be positive" on a field that isn't on screen, so Next
    // refused to move and there was no message to explain it.
    waterSupply: z.object({
      staticPressurePsi: optionalNumber(z.coerce.number()),
      residualPressurePsi: optionalNumber(z.coerce.number()),
      flowAtResidualGpm: optionalNumber(z.coerce.number()),
    }),
    gravityTank: z.object({
      waterLevelHeightFt: optionalNumber(z.coerce.number()),
      outletRuns: z.array(supplyPipeRunSchema),
    }),

    // --- step 5: pipe network ---
    // Branch by branch, sprinkler by sprinkler, each with its pipe -- see network.ts.
    network: networkSchema,
    deviceLosses: z.array(deviceLossSchema),
    hoseStreamNodeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // calc-core requires the hose stream node whenever the allowance is non-zero. It is added at a
    // point on the riser, picked from the ones the network actually has: removing a riser run
    // takes its point with it, and a choice that no longer exists must be said, not guessed at.
    if (data.hoseStreamGpm > 0) {
      const choice = data.hoseStreamNodeId?.trim();
      if (!choice) {
        ctx.addIssue({
          code: "custom",
          path: ["hoseStreamNodeId"],
          message: "Required when a hose stream allowance is given",
        });
      } else if (!riserNodeIds(data.network.riser.length).includes(choice)) {
        ctx.addIssue({
          code: "custom",
          path: ["hoseStreamNodeId"],
          message: "Choose a point on the riser",
        });
      }
    }

    // Only the chosen source's block is validated. "NONE" validates neither: a cistern awaiting a
    // pump is a complete, valid calculation with no supply figures behind it at all.
    const requirePositive = (path: (string | number)[], value: number | undefined, message: string) => {
      if (value === undefined) {
        ctx.addIssue({ code: "custom", path, message: "Required" });
      } else if (!(value > 0)) {
        ctx.addIssue({ code: "custom", path, message });
      }
    };

    if (data.supplySource === "FLOW_TEST") {
      const { staticPressurePsi, residualPressurePsi, flowAtResidualGpm } = data.waterSupply;
      requirePositive(["waterSupply", "staticPressurePsi"], staticPressurePsi, "Must be positive");
      if (residualPressurePsi === undefined) {
        ctx.addIssue({ code: "custom", path: ["waterSupply", "residualPressurePsi"], message: "Required" });
      } else if (residualPressurePsi < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["waterSupply", "residualPressurePsi"],
          message: "Cannot be negative",
        });
      }
      requirePositive(["waterSupply", "flowAtResidualGpm"], flowAtResidualGpm, "Must be positive");
      // calc-core's SupplyCurve requires the residual to sit below the static pressure.
      if (
        staticPressurePsi !== undefined &&
        residualPressurePsi !== undefined &&
        residualPressurePsi >= staticPressurePsi
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["waterSupply", "residualPressurePsi"],
          message: "Must be below the static pressure",
        });
      }
    }

    if (data.supplySource === "GRAVITY_TANK") {
      const { waterLevelHeightFt, outletRuns } = data.gravityTank;
      if (waterLevelHeightFt === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["gravityTank", "waterLevelHeightFt"],
          message: "Required — a tank at or below the connection is not a gravity supply",
        });
      } else if (!(waterLevelHeightFt > 0)) {
        ctx.addIssue({
          code: "custom",
          path: ["gravityTank", "waterLevelHeightFt"],
          message: "Must be positive — a tank at or below the connection is not a gravity supply",
        });
      }

      outletRuns.forEach((run, index) => {
        const at = (field: string) => ["gravityTank", "outletRuns", index, field];
        if (!run.pipeMaterial.trim()) {
          ctx.addIssue({ code: "custom", path: at("pipeMaterial"), message: "Required" });
        }
        if (!run.nominalSize.trim()) {
          ctx.addIssue({ code: "custom", path: at("nominalSize"), message: "Required" });
        }
        requirePositive(at("cFactor"), run.cFactor, "Must be positive");
        if (run.pipeLengthFt === undefined) {
          ctx.addIssue({ code: "custom", path: at("pipeLengthFt"), message: "Required" });
        } else if (run.pipeLengthFt < 0) {
          ctx.addIssue({ code: "custom", path: at("pipeLengthFt"), message: "Cannot be negative" });
        }
      });
    }

    // calc-core's SegmentFitting needs either a type to look up or an explicit length. Every pipe
    // in the network can carry fittings, wherever it sits, so this walks them all; the path it
    // reports is the field's own, which is where the message appears.
    for (const { path, run } of pipeRuns(data.network)) {
      run.fittings.forEach((fitting, fittingIndex) => {
        if (!fitting.fittingType?.trim() && fitting.explicitEquivalentLengthFt === undefined) {
          ctx.addIssue({
            code: "custom",
            path: [...path.split("."), "fittings", fittingIndex, "explicitEquivalentLengthFt"],
            message: "Choose a fitting type or enter an equivalent length",
          });
        }
      });
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields arrive as strings). */
export type SprinklerFormInput = z.input<typeof sprinklerHydraulicsSchema>;

/** Post-coercion shape, the only thing request.ts maps from. */
export type SprinklerFormValues = z.output<typeof sprinklerHydraulicsSchema>;

export const STEPS = ["project", "design", "remote", "supply", "network", "results"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  project: "Project & hazard",
  design: "Design data",
  remote: "Remote area",
  supply: "Water supply",
  network: "Pipe network",
  results: "Results",
};

/**
 * Which fields each step validates when moving forward. Results validates nothing of its own —
 * reaching it means every input step already passed.
 */
export const STEP_FIELDS: Record<StepId, readonly (keyof SprinklerFormInput)[]> = {
  project: [
    "projectName",
    "systemType",
    "hazard",
    "densityGpmPerSqFt",
    "designAreaSqFt",
    "hoseStreamGpm",
    "coveragePerSprinklerSqFt",
    "quickResponseSprinklers",
    "ceilingHeightFt",
  ],
  design: ["defaultKFactor", "defaultPipeMaterial", "defaultSchedule", "defaultCFactor"],
  remote: ["sprinklerSpacingFt"],
  supply: ["supplySource", "waterSupply", "gravityTank"],
  network: ["network", "deviceLosses", "hoseStreamNodeId"],
  results: [],
};

/**
 * A step's position as the user sees it, counted from 1. Used wherever text points at another
 * step, so adding a step can't leave "see step 4" pointing at the wrong one.
 */
export function stepNumber(step: StepId): number {
  return STEPS.indexOf(step) + 1;
}
