import { z } from "zod";

/**
 * Wraps a coerced-number schema so a blank form input is treated as "not provided" rather
 * than coerced to 0. NumberField submits a blank optional field as `""`, not `undefined` —
 * z.coerce.number() would turn that into 0 before `.optional()` ever sees it, silently
 * turning "left blank" into "entered 0".
 */
export function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === "" ? undefined : val), schema.optional());
}

/**
 * The opposite of optionalNumber: a blank input is "not entered yet", reported as required, not
 * quietly coerced to 0. Used for measured quantities where 0 is a legitimate answer but must be
 * *typed* -- a pipe length, say -- so an untouched field blocks the calculation instead of
 * standing in for a real figure.
 */
export function requiredNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === "" || val === null ? undefined : val), schema);
}
