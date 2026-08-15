import { z } from "zod";
import { diameterSpecFields, validateDiameterSpec } from "@/lib/diameterSpec";
import { FLUIDS, FRICTION_FACTOR_METHODS } from "./types";

/** Matches PipeUnitParsing's FLOW_RATE_UNITS keys exactly (shared with pipe velocity). */
export const FLOW_RATE_UNITS = ["L/s", "L/min", "m3/s", "m3/hr", "gpm"] as const;

const FLUID_KEYS = FLUIDS.map((f) => f.key) as [string, ...string[]];

/**
 * The diameterSpecFields shape and its validation are shared with pipe velocity's schema via
 * lib/diameterSpec.ts, since both forms embed the same DiameterSpecInput component.
 */
export const pressureLossSchema = z
  .object({
    fluidKey: z.enum(FLUID_KEYS),
    fluidTemperatureCelsius: z.coerce.number(),
    flowRateValue: z.coerce.number().positive("Must be positive"),
    flowRateUnit: z.enum(FLOW_RATE_UNITS),
    ...diameterSpecFields,
    pipeLengthMeters: z.coerce.number().positive("Must be positive"),
    method: z.enum(FRICTION_FACTOR_METHODS),
  })
  .superRefine(validateDiameterSpec);

export type PressureLossFormInput = z.input<typeof pressureLossSchema>;
export type PressureLossFormValues = z.output<typeof pressureLossSchema>;
