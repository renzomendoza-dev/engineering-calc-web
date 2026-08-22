import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";
import { SYSTEM_TYPES } from "./types";

/**
 * additionalVolumeFactor uses optionalNumber (not plain z.coerce.number().optional()) so a
 * blank field means "use the backend's 1.0 default" rather than coercing to 0 and failing the
 * positive check -- same reasoning as fire-water-storage's selectedDurationMinutes.
 */
export const expansionTankSchema = z.object({
  systemType: z.enum(SYSTEM_TYPES, "System type is required"),
  primaryVesselVolumeLiters: z.coerce.number().positive("Must be positive"),
  estimatedPipingLengthMeters: z.coerce.number().min(0, "Cannot be negative"),
  averagePipeDiameterMm: z.coerce.number().positive("Must be positive"),
  additionalVolumeFactor: optionalNumber(z.coerce.number().positive("Must be positive")),
  coldWaterTemperatureCelsius: z.coerce.number(),
  hotWaterTemperatureCelsius: z.coerce.number(),
  fillPressureGaugeKpa: z.coerce.number().positive("Must be positive"),
  maxOperatingPressureGaugeKpa: z.coerce.number().positive("Must be positive"),
  altitudeMeters: z.coerce.number(),
});

export type ExpansionTankFormInput = z.input<typeof expansionTankSchema>;
export type ExpansionTankFormValues = z.output<typeof expansionTankSchema>;
