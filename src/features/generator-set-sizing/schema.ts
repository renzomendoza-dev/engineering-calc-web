import { z } from "zod";
import { optionalNumber, requiredNumber } from "@/lib/zodHelpers";
import { TERMINATION_TEMP_RATINGS } from "@/features/wire-sizing/types";
import { GENERATOR_PHASE_TYPES, OPTIONAL_STANDBY_CLASS } from "./types";

/**
 * Mirrors the backend's validation rules: Bean Validation on GeneratorSetSizingRequest and its
 * item DTOs (calc-api), and GeneratorSetSizingInput's compact constructors (calc-core). The one
 * rule that is calc-core's alone, an unknown occupancy or a unit load below Table 2.20.2.3's
 * minimum, is left to the API: the form offers only valid occupancies and says the minimum under
 * the field.
 *
 * Labels are FORM-ONLY in the sense that the API only prints them back on the load schedule.
 * Blank means "use the default name".
 */
const lightingAreaSchema = z.object({
  label: z.string(),
  occupancy: z.string().min(1, "Select an occupancy"),
  areaType: z.string(),
  floorAreaM2: requiredNumber(z.coerce.number("Required").positive("Must be positive")),
  unitLoadVoltAmperesPerM2: optionalNumber(z.coerce.number().positive("Must be positive")),
  entireLightingUsedAtOnce: z.boolean(),
  continuous: z.boolean(),
});

const receptacleGroupSchema = z.object({
  label: z.string(),
  outlets: requiredNumber(
    z.coerce.number("Required").int("Must be a whole number").min(1, "Must be at least 1"),
  ),
  bankOrOfficeFloorAreaM2: optionalNumber(z.coerce.number().positive("Must be positive")),
  continuous: z.boolean(),
});

const otherLoadSchema = z.object({
  label: z.string(),
  voltAmperes: requiredNumber(z.coerce.number("Required").positive("Must be positive")),
  demandFactorPercent: requiredNumber(
    z.coerce.number("Required").positive("Must be positive").max(100, "At most 100"),
  ),
  continuous: z.boolean(),
});

const motorSchema = z.object({
  label: z.string(),
  horsepowerLabel: z.string().min(1, "Select a horsepower"),
  voltage: requiredNumber(z.coerce.number("Select a voltage").int().positive("Select a voltage")),
  quantity: requiredNumber(
    z.coerce.number("Required").int("Must be a whole number").min(1, "Must be at least 1"),
  ),
});

const outputConductorSchema = z.object({
  ambientTempCelsius: z.coerce.number(),
  numberOfCurrentCarryingConductors: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  numberOfParallelSets: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
  insulationType: z.string(),
  conductorMaterial: z.string(),
  terminationTempRatingCelsius: z.coerce.number().optional(),
});

export const generatorSetSchema = z
  .object({
    standbyClass: z.string().min(1, "Select the standby class"),
    optionalTransfer: z.string(),
    phaseType: z.enum(GENERATOR_PHASE_TYPES),
    voltage: requiredNumber(
      z.coerce.number("Required").int("Must be a whole number").positive("Must be positive"),
    ),
    lightingAreas: z.array(lightingAreaSchema),
    receptacleGroups: z.array(receptacleGroupSchema),
    applyReceptacleDemandFactor: z.boolean(),
    otherLoads: z.array(otherLoadSchema),
    motors: z.array(motorSchema),
    generatorPowerFactor: z.coerce
      .number()
      .positive("Must be greater than 0")
      .max(1, "At most 1"),
    spareCapacityPercent: z.coerce.number().min(0, "Cannot be negative"),
    selectedGeneratorKva: optionalNumber(z.coerce.number().positive("Must be positive")),
    designPreventsOverload: z.boolean(),
    sizeOutputConductor: z.boolean(),
    outputConductor: outputConductorSchema,
  })
  .superRefine((data, ctx) => {
    if (data.standbyClass === OPTIONAL_STANDBY_CLASS && !data.optionalTransfer) {
      ctx.addIssue({
        code: "custom",
        path: ["optionalTransfer"],
        message: "Select how load is transferred",
      });
    }

    const loadCount =
      data.lightingAreas.length +
      data.receptacleGroups.length +
      data.otherLoads.length +
      data.motors.length;
    if (loadCount === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["lightingAreas"],
        message: "Add at least one load: lighting, receptacles, another load or a motor",
      });
    }

    if (data.sizeOutputConductor) {
      const conductor = data.outputConductor;
      if (!conductor.insulationType) {
        ctx.addIssue({
          code: "custom",
          path: ["outputConductor", "insulationType"],
          message: "Insulation type is required",
        });
      }
      if (!conductor.conductorMaterial) {
        ctx.addIssue({
          code: "custom",
          path: ["outputConductor", "conductorMaterial"],
          message: "Conductor material is required",
        });
      }
      const rating = conductor.terminationTempRatingCelsius;
      if (rating === undefined || !(TERMINATION_TEMP_RATINGS as readonly number[]).includes(rating)) {
        ctx.addIssue({
          code: "custom",
          path: ["outputConductor", "terminationTempRatingCelsius"],
          message: "Select a termination temperature rating",
        });
      }
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type GeneratorSetFormInput = z.input<typeof generatorSetSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type GeneratorSetFormValues = z.output<typeof generatorSetSchema>;
