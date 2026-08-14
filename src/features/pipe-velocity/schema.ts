import { z } from "zod";

/** Matches PipeVelocityMapper's FLOW_RATE_UNITS keys exactly. */
export const FLOW_RATE_UNITS = ["L/s", "L/min", "m3/s", "m3/hr", "gpm"] as const;

/** Matches PipeVelocityMapper's LENGTH_UNITS keys — subset offered for raw diameter entry. */
export const RAW_DIAMETER_UNITS = ["mm", "in"] as const;

/** Matches PipeVelocityMapper's SPEED_UNITS keys. */
export const TARGET_VELOCITY_UNITS = ["m/s", "ft/s"] as const;

export const DIAMETER_SOURCES = ["standard", "custom"] as const;
export type DiameterSource = (typeof DIAMETER_SOURCES)[number];

/**
 * "Check velocity" mode (VELOCITY_FROM_DIAMETER). diameterSource is a UI-only concept that
 * maps to the request's diameterSpecType (standard -> NOMINAL, custom -> RAW); the fields for
 * whichever side isn't selected are `.optional()` since they're unmounted, not just disabled
 * — same reasoning as voltage drop's schema.
 */
export const checkVelocitySchema = z
  .object({
    flowRateValue: z.coerce.number().positive("Must be positive"),
    flowRateUnit: z.enum(FLOW_RATE_UNITS),
    diameterSource: z.enum(DIAMETER_SOURCES),
    nominalMaterial: z.string().optional(),
    nominalSchedule: z.string().optional(),
    nominalSize: z.string().optional(),
    rawDiameterValue: z.coerce.number().optional(),
    rawDiameterUnit: z.enum(RAW_DIAMETER_UNITS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.diameterSource === "standard") {
      if (!data.nominalMaterial) {
        ctx.addIssue({ code: "custom", path: ["nominalMaterial"], message: "Material is required" });
      }
      if (!data.nominalSize) {
        ctx.addIssue({ code: "custom", path: ["nominalSize"], message: "Pipe size is required" });
      }
    } else {
      if (data.rawDiameterValue === undefined || data.rawDiameterValue <= 0) {
        ctx.addIssue({ code: "custom", path: ["rawDiameterValue"], message: "Must be positive" });
      }
      if (!data.rawDiameterUnit) {
        ctx.addIssue({ code: "custom", path: ["rawDiameterUnit"], message: "Unit is required" });
      }
    }
  });

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
