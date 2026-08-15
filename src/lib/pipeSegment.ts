import { z } from "zod";
import { diameterSpecFields, validateDiameterSpec } from "./diameterSpec";
import { FRICTION_FACTOR_METHODS } from "./frictionFactorMethod";

/**
 * One row of PipeSegmentListInput: a diameter spec plus length and friction method. Shared
 * shape (and validation) for both the suction and discharge piping sections on the pump TDH
 * form — each side is just a differently-named array of this same row schema.
 */
export const pipeSegmentSchema = z
  .object({
    ...diameterSpecFields,
    lengthMeters: z.coerce.number().positive("Must be positive"),
    method: z.enum(FRICTION_FACTOR_METHODS),
  })
  .superRefine(validateDiameterSpec);

export type PipeSegmentFormInput = z.input<typeof pipeSegmentSchema>;
export type PipeSegmentFormValues = z.output<typeof pipeSegmentSchema>;

/**
 * No `.min()` — an empty segment list is a legitimate result (e.g. no suction piping when the
 * pump sits directly in a flooded wet well), not an incomplete form, unlike the fire pump curve
 * list's minimum-2-row requirement.
 */
export const pipeSegmentListSchema = z.array(pipeSegmentSchema);

export const DEFAULT_PIPE_SEGMENT: PipeSegmentFormInput = {
  diameterSource: "standard",
  nominalMaterial: "",
  nominalSchedule: "",
  nominalSize: "",
  rawDiameterValue: undefined,
  rawDiameterUnit: "mm",
  lengthMeters: 0,
  method: "SWAMEE_JAIN",
};
