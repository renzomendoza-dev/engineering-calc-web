import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";
import { HAZARD_CLASSIFICATIONS } from "./types";

/**
 * selectedDurationMinutes uses the optionalNumber helper (not plain z.coerce.number()
 * .optional()) since NumberField submits a blank field as "" rather than undefined — without
 * this, a blank field would coerce to 0 and get rejected as below every hazard class's
 * minimum, instead of correctly meaning "use the conservative default" (null on the wire).
 * Same bug this helper was extracted to fix in wire sizing/smoke-plume.
 */
export const fireWaterStorageSchema = z.object({
  ratedPumpFlowGpm: z.coerce.number().positive("Must be positive"),
  hazardClassification: z.enum(HAZARD_CLASSIFICATIONS, "Hazard classification is required"),
  selectedDurationMinutes: optionalNumber(z.coerce.number().positive("Must be positive")),
  safetyMarginPercent: z.coerce.number().min(0, "Cannot be negative"),
});

export type FireWaterStorageFormInput = z.input<typeof fireWaterStorageSchema>;
export type FireWaterStorageFormValues = z.output<typeof fireWaterStorageSchema>;
