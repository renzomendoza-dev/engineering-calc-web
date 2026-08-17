import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";

/**
 * Mirrors calc-api's VentAreaRequest Bean Validation for the required fields exactly
 * (volumetricFlowRate/ventHeight positive; smokeTemperature/ambientTemperature required with
 * no sign constraint, since negative Celsius is physically valid). Deliberately its own
 * feature folder/schema file, per this domain's established convention (each smoke-control
 * calculator has a fully separate schema -- see smoke-plume and smoke-plume-tsquared), not a
 * shared src/lib/schemas/ module.
 *
 * dischargeCoefficient has no bounds annotation on the backend (it deliberately leaves
 * range-checking, (0, 1], to calc-core's own validation), but a basic positivity check here
 * is still reasonable client-side sanity-checking, same treatment as the sibling smoke-plume
 * schemas' optional dimensionless fractions. calc-core's own domain rules (deltaT must be
 * strictly positive, Cd must be <= 1 when supplied) are intentionally NOT duplicated here --
 * they surface as a general API error via useApiFormError.
 */
export const ventAreaSchema = z.object({
  volumetricFlowRate: z.coerce.number().positive("Must be positive"),
  smokeTemperature: z.coerce.number(),
  ambientTemperature: z.coerce.number(),
  ventHeight: z.coerce.number().positive("Must be positive"),
  dischargeCoefficient: optionalNumber(z.coerce.number().positive("Must be positive")),
});

export type VentAreaFormInput = z.input<typeof ventAreaSchema>;
export type VentAreaFormValues = z.output<typeof ventAreaSchema>;
