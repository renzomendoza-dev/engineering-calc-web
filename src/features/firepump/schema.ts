import { z } from "zod";
import { SUCTION_CONDITIONS, FIRE_PUMP_POWER_INPUT_TYPES } from "./types";

/**
 * Mirrors calc-api's FirePumpDemandRequest.isSuctionFieldsValid(): when suctionCondition is
 * FLOODED, availableSuctionPressurePsi is required (suctionLiftFeet unmounted/omitted); when
 * LIFT, suctionLiftFeet is required instead. Both fields are `.optional()` since the inactive
 * one is unmounted, not just disabled — same pattern as voltage drop's schema.
 */
export const demandSchema = z
  .object({
    requiredFlowGpm: z.coerce.number().positive("Must be positive"),
    requiredPressurePsiAtDemandPoint: z.coerce.number().positive("Must be positive"),
    suctionCondition: z.enum(SUCTION_CONDITIONS, "Suction condition is required"),
    availableSuctionPressurePsi: z.coerce.number().optional(),
    suctionLiftFeet: z.coerce.number().optional(),
    safetyMarginPercent: z.coerce.number().min(0, "Cannot be negative").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.suctionCondition === "FLOODED") {
      if (data.availableSuctionPressurePsi === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["availableSuctionPressurePsi"],
          message: "Required for flooded suction",
        });
      }
    } else if (data.suctionLiftFeet === undefined) {
      ctx.addIssue({ code: "custom", path: ["suctionLiftFeet"], message: "Required for suction lift" });
    }
  });

export type DemandFormInput = z.input<typeof demandSchema>;
export type DemandFormValues = z.output<typeof demandSchema>;

export const capacitySchema = z.object({
  ratedFlowGpm: z.coerce.number().positive("Must be positive"),
});

export type CapacityFormInput = z.input<typeof capacitySchema>;
export type CapacityFormValues = z.output<typeof capacitySchema>;

/** Shared row shape for PumpCurvePointsInput, used by both curve validation and power. */
export const curvePointSchema = z.object({
  flowGpm: z.coerce.number().min(0, "Cannot be negative"),
  pressurePsi: z.coerce.number().positive("Must be positive"),
});

export const curveValidationSchema = z.object({
  candidateRatedFlowGpm: z.coerce.number().positive("Must be positive"),
  candidateRatedPressurePsi: z.coerce.number().positive("Must be positive"),
  curvePoints: z.array(curvePointSchema).min(2, "At least 2 curve points are required"),
  demandFlowGpm: z.coerce.number().positive("Must be positive"),
  demandPressurePsi: z.coerce.number().positive("Must be positive"),
});

export type CurveValidationFormInput = z.input<typeof curveValidationSchema>;
export type CurveValidationFormValues = z.output<typeof curveValidationSchema>;

/**
 * Mirrors calc-api's FirePumpPowerRequest.isInputTypeFieldsValid(): RATED_POINT_ONLY requires
 * flowGpm/pressurePsi, FULL_CURVE requires curveRatedFlowGpm/curveRatedPressurePsi/curvePoints.
 * pumpEfficiencyPercent is 0-100 in the UI (more natural to type than a 0-1 fraction) and is
 * divided by 100 before building the request, since the API expects a fraction in (0, 1].
 */
export const powerSchema = z
  .object({
    inputType: z.enum(FIRE_PUMP_POWER_INPUT_TYPES),
    flowGpm: z.coerce.number().optional(),
    pressurePsi: z.coerce.number().optional(),
    curveRatedFlowGpm: z.coerce.number().optional(),
    curveRatedPressurePsi: z.coerce.number().optional(),
    curvePoints: z.array(curvePointSchema).optional(),
    pumpEfficiencyPercent: z.coerce
      .number()
      .positive("Must be positive")
      .max(100, "Cannot exceed 100%"),
    specificGravity: z.coerce.number().positive("Must be positive").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.inputType === "RATED_POINT_ONLY") {
      if (data.flowGpm === undefined || data.flowGpm <= 0) {
        ctx.addIssue({ code: "custom", path: ["flowGpm"], message: "Must be positive" });
      }
      if (data.pressurePsi === undefined || data.pressurePsi <= 0) {
        ctx.addIssue({ code: "custom", path: ["pressurePsi"], message: "Must be positive" });
      }
    } else {
      if (data.curveRatedFlowGpm === undefined || data.curveRatedFlowGpm <= 0) {
        ctx.addIssue({ code: "custom", path: ["curveRatedFlowGpm"], message: "Must be positive" });
      }
      if (data.curveRatedPressurePsi === undefined || data.curveRatedPressurePsi <= 0) {
        ctx.addIssue({ code: "custom", path: ["curveRatedPressurePsi"], message: "Must be positive" });
      }
      if (!data.curvePoints || data.curvePoints.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["curvePoints"],
          message: "At least 2 curve points are required",
        });
      }
    }
  });

export type PowerFormInput = z.input<typeof powerSchema>;
export type PowerFormValues = z.output<typeof powerSchema>;
