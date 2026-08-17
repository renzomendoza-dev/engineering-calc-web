import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";

/**
 * Mirrors calc-api's TSquaredSmokeProductionRequest Bean Validation for the required fields
 * exactly (fireGrowthRate/cappingHRR/ceilingHeight positive, evaluationTime non-negative,
 * ambientTemperature required with no sign constraint). Deliberately a separate schema from
 * the sibling smoke-plume feature's — not imported or extended — matching the "fully
 * separate" decision already made at the core/API layers.
 *
 * convectiveFraction and fractionConvectiveHeatInSmokeLayer have no bounds annotation on the
 * backend (it deliberately leaves range-checking to calc-core's default), but a basic
 * positivity check here is still reasonable client-side sanity-checking for these
 * dimensionless fractions, same treatment as the sibling schema. fireBaseHeight is left
 * unconstrained beyond being a number, matching the backend's own DTO. calc-core's own domain
 * rule (fireBaseHeight < ceilingHeight) is intentionally NOT duplicated here — it surfaces as
 * a general API error via useApiFormError.
 */
export const tSquaredSmokePlumeSchema = z.object({
  fireGrowthRate: z.coerce.number().positive("Must be positive"),
  cappingHRR: z.coerce.number().positive("Must be positive"),
  evaluationTime: z.coerce.number().min(0, "Cannot be negative"),
  convectiveFraction: optionalNumber(z.coerce.number().positive("Must be positive")),
  ceilingHeight: z.coerce.number().positive("Must be positive"),
  fireBaseHeight: optionalNumber(z.coerce.number()),
  ambientTemperature: z.coerce.number(),
  fractionConvectiveHeatInSmokeLayer: optionalNumber(z.coerce.number().positive("Must be positive")),
});

export type TSquaredSmokePlumeFormInput = z.input<typeof tSquaredSmokePlumeSchema>;
export type TSquaredSmokePlumeFormValues = z.output<typeof tSquaredSmokePlumeSchema>;
