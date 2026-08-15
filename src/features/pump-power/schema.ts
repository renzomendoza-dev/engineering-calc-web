import { z } from "zod";
import { FLOW_RATE_UNITS } from "@/lib/flowRateUnit";

export { FLOW_RATE_UNITS };

/**
 * `pumpEfficiencyPercent` is 0-100 in the UI (more natural to type than a 0-1 fraction) and is
 * divided by 100 before building the request, since the API expects a fraction — calc-core's
 * PumpPowerInput rejects anything > 1.
 */
export const powerSchema = z.object({
  flowRateValue: z.coerce.number().positive("Must be positive"),
  flowRateUnit: z.enum(FLOW_RATE_UNITS),
  totalDynamicHeadMeters: z.coerce.number().positive("Must be positive"),
  pumpEfficiencyPercent: z.coerce.number().positive("Must be positive").max(100, "Cannot exceed 100%"),
  fluidDensityKgM3: z.coerce.number().positive("Must be positive"),
});

export type PowerFormInput = z.input<typeof powerSchema>;
export type PowerFormValues = z.output<typeof powerSchema>;
