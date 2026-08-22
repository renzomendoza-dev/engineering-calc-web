import { z } from "zod";
import { FRICTION_FACTOR_METHODS } from "@/lib/frictionFactorMethod";
import { DUCT_SHAPES, DUCT_SIZING_METHODS, FIXED_DIMENSION_TYPES } from "./types";

/**
 * Mirrors calc-api's DuctSizingRequest Bean Validation exactly: TWO independent
 * conditional-required-field groups (shape, method), each enforced by its own superRefine
 * check below — same pattern as VoltageDropRequest's useCustomImpedance / WireSizingRequest's
 * includeVoltageDropCheck, applied twice here since the two toggles are independent of each
 * other (e.g. RECTANGULAR + VELOCITY is a valid combination requiring both groups' fields).
 *
 * fixedDimensionType/fixedDimensionValueMm/targetFrictionRatePaPerM/maxVelocityMps are all
 * `.optional()`: the corresponding fields are unmounted (not just disabled) when their shape/
 * method isn't selected, and react-hook-form drops unmounted fields from the submitted
 * values — the superRefine below treats a missing value as "not yet filled in" for whichever
 * fields are actually required in the current shape/method combination.
 */
export const ductSizingSchema = z
  .object({
    method: z.enum(DUCT_SIZING_METHODS, "Sizing method is required"),
    airFlowLps: z.coerce.number().positive("Must be positive"),
    airTemperatureCelsius: z.coerce.number(),
    altitudeMeters: z.coerce.number(),
    ductMaterial: z.string().min(1, "Duct material is required"),
    frictionMethod: z.enum(FRICTION_FACTOR_METHODS, "Friction factor method is required"),

    shape: z.enum(DUCT_SHAPES, "Duct shape is required"),
    fixedDimensionType: z.enum(FIXED_DIMENSION_TYPES).optional(),
    fixedDimensionValueMm: z.coerce.number().optional(),

    targetFrictionRatePaPerM: z.coerce.number().optional(),
    maxVelocityMps: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shape === "RECTANGULAR") {
      if (!data.fixedDimensionType) {
        ctx.addIssue({
          code: "custom",
          path: ["fixedDimensionType"],
          message: "Fixed dimension is required for rectangular ducts",
        });
      }
      if (data.fixedDimensionValueMm === undefined || data.fixedDimensionValueMm <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["fixedDimensionValueMm"],
          message: "Must be positive",
        });
      }
    }

    if (data.method === "EQUAL_FRICTION") {
      if (data.targetFrictionRatePaPerM === undefined || data.targetFrictionRatePaPerM <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["targetFrictionRatePaPerM"],
          message: "Must be positive",
        });
      }
    }

    if (data.method === "VELOCITY") {
      if (data.maxVelocityMps === undefined || data.maxVelocityMps <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["maxVelocityMps"],
          message: "Must be positive",
        });
      }
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type DuctSizingFormInput = z.input<typeof ductSizingSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type DuctSizingFormValues = z.output<typeof ductSizingSchema>;
