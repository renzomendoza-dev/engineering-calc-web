import { z } from "zod";

/**
 * Mirrors calc-api's DistanceAttenuationRequest Bean Validation constraints exactly.
 * referenceSplDb has no `.positive()` — SPL can legitimately be very low or even negative dB
 * relative to the reference threshold, same reasoning the backend DTO documents.
 */
export const distanceAttenuationSchema = z.object({
  referenceSplDb: z.coerce.number(),
  referenceDistance: z.coerce.number().positive("Must be positive"),
  targetDistance: z.coerce.number().positive("Must be positive"),
});

export type DistanceAttenuationFormInput = z.input<typeof distanceAttenuationSchema>;
export type DistanceAttenuationFormValues = z.output<typeof distanceAttenuationSchema>;
