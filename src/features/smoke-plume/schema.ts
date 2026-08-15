import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";

/**
 * Mirrors calc-api's SmokeProductionRequest Bean Validation for the required fields exactly
 * (designFireArea/heatReleaseRateDensity/ceilingHeight positive, ambientTemperature required
 * with no sign constraint). convectiveFraction and fractionConvectiveHeatInSmokeLayer have no
 * bounds annotation on the backend (it deliberately leaves range-checking to calc-core's
 * default, rather than guessing one), but a basic positivity check here is still reasonable
 * client-side sanity-checking for these dimensionless fractions. fireBaseHeight is left
 * unconstrained beyond being a number, matching the backend's own DTO. calc-core's own domain
 * rule (fireBaseHeight < ceilingHeight) is intentionally NOT duplicated here — it surfaces as
 * a general API error via useApiFormError, same layering convention as every other feature.
 */
export const smokePlumeSchema = z.object({
  designFireArea: z.coerce.number().positive("Must be positive"),
  heatReleaseRateDensity: z.coerce.number().positive("Must be positive"),
  convectiveFraction: optionalNumber(z.coerce.number().positive("Must be positive")),
  ceilingHeight: z.coerce.number().positive("Must be positive"),
  fireBaseHeight: optionalNumber(z.coerce.number()),
  ambientTemperature: z.coerce.number(),
  fractionConvectiveHeatInSmokeLayer: optionalNumber(z.coerce.number().positive("Must be positive")),
});

export type SmokePlumeFormInput = z.input<typeof smokePlumeSchema>;
export type SmokePlumeFormValues = z.output<typeof smokePlumeSchema>;
