import { z } from "zod";
import { diameterSpecFields, validateDiameterSpec } from "@/lib/diameterSpec";

export { DIAMETER_SOURCES, RAW_DIAMETER_UNITS, type DiameterSource } from "@/lib/diameterSpec";

/** Matches PipeUnitParsing's FLOW_RATE_UNITS keys exactly (shared with pipe pressure loss). */
export const FLOW_RATE_UNITS = ["L/s", "L/min", "m3/s", "m3/hr", "gpm"] as const;

/** Matches PipeVelocityMapper's SPEED_UNITS keys. */
export const TARGET_VELOCITY_UNITS = ["m/s", "ft/s"] as const;

/**
 * "Check velocity" mode (VELOCITY_FROM_DIAMETER). The diameterSpecFields shape and its
 * validation are shared with pipe pressure loss's schema via lib/diameterSpec.ts, since both
 * forms embed the same DiameterSpecInput component.
 */
export const checkVelocitySchema = z
  .object({
    flowRateValue: z.coerce.number().positive("Must be positive"),
    flowRateUnit: z.enum(FLOW_RATE_UNITS),
    ...diameterSpecFields,
  })
  .superRefine(validateDiameterSpec);

export type CheckVelocityFormInput = z.input<typeof checkVelocitySchema>;
export type CheckVelocityFormValues = z.output<typeof checkVelocitySchema>;

/**
 * "Size a pipe" mode (DIAMETER_FROM_VELOCITY). `schedule` is required here even though
 * calc-api's own DTO deliberately leaves it unenforced (see PipeVelocityRequest's Javadoc) —
 * the form always resolves a concrete schedule itself (auto-selected for single-schedule
 * materials, user-picked otherwise) before submit, so requiring it client-side just catches
 * the "material picked, schedule dropdown not yet resolved" race rather than duplicating any
 * reference-data judgment.
 */
export const sizePipeSchema = z.object({
  flowRateValue: z.coerce.number().positive("Must be positive"),
  flowRateUnit: z.enum(FLOW_RATE_UNITS),
  targetVelocityValue: z.coerce.number().positive("Must be positive"),
  targetVelocityUnit: z.enum(TARGET_VELOCITY_UNITS),
  pipeMaterial: z.string().min(1, "Material is required"),
  schedule: z.string().min(1, "Schedule is required"),
});

export type SizePipeFormInput = z.input<typeof sizePipeSchema>;
export type SizePipeFormValues = z.output<typeof sizePipeSchema>;
