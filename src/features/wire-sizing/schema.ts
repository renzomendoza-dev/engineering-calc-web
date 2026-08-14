import { z } from "zod";
import { CIRCUIT_TYPES, CONDUCTOR_MATERIALS, CONDUIT_MATERIALS } from "@/features/voltage-drop/types";
import { TERMINATION_TEMP_RATINGS } from "./types";

/**
 * Mirrors the backend's validation rules exactly:
 *  - Bean Validation on WireSizingRequest / VoltageDropCheckRequestDto (calc-api)
 *  - WireSizingInput's compact constructor (calc-core): terminationTempRatingCelsius must be
 *    exactly 60, 75, or 90
 *  - VoltageDropInput's compact constructor, exercised via WireSizingCalculator's voltage
 *    drop check: powerFactor must be in (0, 1] for AC circuits
 *
 * voltageDropCheck's fields are all `.optional()`: the sub-section is unmounted (not just
 * disabled) when includeVoltageDropCheck is false, and react-hook-form drops unmounted
 * fields from the submitted values. superRefine below requires them only when
 * includeVoltageDropCheck is true — same pattern as voltage-drop's useCustomImpedance and
 * conduit-fill's useCustomImpedance conditional sections.
 *
 * One backend quirk this mirrors deliberately: VoltageDropCheckRequestDto.conduitMaterial is
 * @NotBlank unconditionally, even for DC circuits (calc-core's ConductorPropertiesResolver
 * ignores it for DC lookups but still requires *some* value "for API consistency across both
 * circuit types" — see that class's Javadoc). So conduitMaterial is required here whenever
 * includeVoltageDropCheck is true, with no DC exception — unlike voltage-drop's own schema,
 * where conduitMaterial is exempted for DC. WireSizingForm compensates by defaulting
 * conduitMaterial to "PVC" behind the scenes when DC is selected, rather than hiding it with
 * no value at all.
 */
export const wireSizingSchema = z
  .object({
    loadCurrentAmps: z.coerce.number().positive("Must be positive"),
    isContinuousLoad: z.boolean(),
    ambientTempCelsius: z.coerce.number(),
    numberOfCurrentCarryingConductors: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Must be at least 1"),
    insulationType: z.string().min(1, "Insulation type is required"),
    conductorMaterial: z.union([z.enum(CONDUCTOR_MATERIALS), z.literal("")]),
    terminationTempRatingCelsius: z.coerce
      .number()
      .refine(
        (value): value is (typeof TERMINATION_TEMP_RATINGS)[number] =>
          (TERMINATION_TEMP_RATINGS as readonly number[]).includes(value),
        { message: "Must be 60, 75, or 90" },
      ),
    includeVoltageDropCheck: z.boolean(),
    voltageDropCheck: z.object({
      circuitType: z.union([z.enum(CIRCUIT_TYPES), z.literal("")]).optional(),
      oneWayLengthMeters: z.coerce.number().optional(),
      powerFactor: z.coerce.number().min(0, "Must be between 0 and 1").max(1, "Must be between 0 and 1").optional(),
      systemVoltage: z.coerce.number().optional(),
      conduitMaterial: z.union([z.enum(CONDUIT_MATERIALS), z.literal("")]).optional(),
      parallelSetsPerPhase: z.coerce.number().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.conductorMaterial) {
      ctx.addIssue({
        code: "custom",
        path: ["conductorMaterial"],
        message: "Conductor material is required",
      });
    }

    if (!data.includeVoltageDropCheck) {
      return;
    }

    const vdc = data.voltageDropCheck;

    if (!vdc.circuitType) {
      ctx.addIssue({
        code: "custom",
        path: ["voltageDropCheck", "circuitType"],
        message: "Circuit type is required",
      });
    }
    if (vdc.oneWayLengthMeters === undefined || vdc.oneWayLengthMeters <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["voltageDropCheck", "oneWayLengthMeters"],
        message: "Must be positive",
      });
    }
    if (vdc.systemVoltage === undefined || vdc.systemVoltage <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["voltageDropCheck", "systemVoltage"],
        message: "Must be positive",
      });
    }
    if (!vdc.conduitMaterial) {
      ctx.addIssue({
        code: "custom",
        path: ["voltageDropCheck", "conduitMaterial"],
        message: "Conduit material is required",
      });
    }
    if (vdc.parallelSetsPerPhase === undefined || vdc.parallelSetsPerPhase < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["voltageDropCheck", "parallelSetsPerPhase"],
        message: "Must be at least 1",
      });
    }
    if (vdc.circuitType && vdc.circuitType !== "DC") {
      if (vdc.powerFactor === undefined || vdc.powerFactor <= 0 || vdc.powerFactor > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["voltageDropCheck", "powerFactor"],
          message: "Must be greater than 0 for AC circuits",
        });
      }
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type WireSizingFormInput = z.input<typeof wireSizingSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type WireSizingFormValues = z.output<typeof wireSizingSchema>;
