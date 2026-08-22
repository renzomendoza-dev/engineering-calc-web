import { z } from "zod";
import { PUMP_CONTROL_TYPES } from "./types";

/**
 * Same flat shape regardless of controlType -- CONVENTIONAL and VFD reuse identical fields
 * with different real-world meaning (see PressureTankForm's LABELS lookup), not different
 * required-field sets, so no superRefine branching is needed here (unlike duct sizing's two
 * independent toggles).
 */
export const pressureTankSchema = z.object({
  controlType: z.enum(PUMP_CONTROL_TYPES, "Pump control type is required"),
  drawdownFlowRateLpm: z.coerce.number().positive("Must be positive"),
  minRunTimeMinutes: z.coerce.number().positive("Must be positive"),
  lowPressureGaugeKpa: z.coerce.number().positive("Must be positive"),
  highPressureGaugeKpa: z.coerce.number().positive("Must be positive"),
  altitudeMeters: z.coerce.number(),
});

export type PressureTankFormInput = z.input<typeof pressureTankSchema>;
export type PressureTankFormValues = z.output<typeof pressureTankSchema>;
