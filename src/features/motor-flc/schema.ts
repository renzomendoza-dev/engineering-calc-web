import { z } from "zod";
import { CIRCUIT_TYPES, CONDUCTOR_MATERIALS, CONDUIT_MATERIALS } from "@/features/voltage-drop/types";
import { TERMINATION_TEMP_RATINGS } from "@/features/wire-sizing/types";

/**
 * One schema covering both the plain-FLC case and the FLC-to-wire-sizing pipeline case,
 * gated by the form-only `includeWireSizing` toggle — mirrors wire sizing's
 * includeVoltageDropCheck toggle, and the voltage-drop-check block nested inside this one
 * (reachable only when includeWireSizing is true) reuses that exact same nested-superRefine
 * shape again, one level deeper.
 *
 * Mirrors calc-core's MotorConductorSizingInput / MotorFlcInput compact constructors:
 *  - motorClass is required when phaseType is "THREE_PHASE" (checked below) and must be
 *    null otherwise — the form only ever shows the motorClass field for THREE_PHASE, and
 *    MotorFlcForm nulls it out on submit for every other phase type, so this superRefine
 *    only needs to check the "required" direction.
 *  - synchronousPowerFactorPercent is only meaningful when motorClass is "SYNCHRONOUS" — the
 *    form hides that field otherwise and MotorFlcForm nulls it out on submit, same pattern.
 *  - numberOfCurrentCarryingConductors / terminationTempRatingCelsius mirror
 *    WireSizingInput's rules, exactly as wire-sizing's own schema already checks them.
 *  - the voltageDropCheck block mirrors wire-sizing's schema verbatim (same fields, same
 *    rules, including the conduitMaterial-required-even-for-DC backend quirk).
 */
export const motorFlcSchema = z
  .object({
    phaseType: z.string().min(1, "Phase type is required"),
    motorClass: z.string().optional(),
    horsepowerLabel: z.string().min(1, "Horsepower is required"),
    voltage: z.coerce.number().positive("Must be positive"),
    synchronousPowerFactorPercent: z.coerce.number().optional(),
    includeWireSizing: z.boolean(),
    ambientTempCelsius: z.coerce.number().optional(),
    numberOfCurrentCarryingConductors: z.coerce.number().int("Must be a whole number").optional(),
    numberOfParallelSets: z.coerce.number().int("Must be a whole number").optional(),
    insulationType: z.string().optional(),
    conductorMaterial: z.union([z.enum(CONDUCTOR_MATERIALS), z.literal("")]).optional(),
    terminationTempRatingCelsius: z.coerce.number().optional(),
    includeVoltageDropCheck: z.boolean(),
    voltageDropCheck: z.object({
      circuitType: z.union([z.enum(CIRCUIT_TYPES), z.literal("")]).optional(),
      oneWayLengthMeters: z.coerce.number().optional(),
      powerFactor: z.coerce
        .number()
        .min(0, "Must be between 0 and 1")
        .max(1, "Must be between 0 and 1")
        .optional(),
      systemVoltage: z.coerce.number().optional(),
      conduitMaterial: z.union([z.enum(CONDUIT_MATERIALS), z.literal("")]).optional(),
      parallelSetsPerPhase: z.coerce.number().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.phaseType === "THREE_PHASE" && !data.motorClass) {
      ctx.addIssue({
        code: "custom",
        path: ["motorClass"],
        message: "Motor class is required for three-phase motors",
      });
    }

    if (!data.includeWireSizing) {
      return;
    }

    if (data.ambientTempCelsius === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["ambientTempCelsius"],
        message: "Ambient temperature is required",
      });
    }
    if (
      data.numberOfCurrentCarryingConductors === undefined ||
      data.numberOfCurrentCarryingConductors < 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["numberOfCurrentCarryingConductors"],
        message: "Must be at least 1",
      });
    }
    if (data.numberOfParallelSets === undefined || data.numberOfParallelSets < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["numberOfParallelSets"],
        message: "Must be at least 1",
      });
    }
    if (!data.insulationType) {
      ctx.addIssue({
        code: "custom",
        path: ["insulationType"],
        message: "Insulation type is required",
      });
    }
    if (!data.conductorMaterial) {
      ctx.addIssue({
        code: "custom",
        path: ["conductorMaterial"],
        message: "Conductor material is required",
      });
    }
    if (
      data.terminationTempRatingCelsius === undefined ||
      !(TERMINATION_TEMP_RATINGS as readonly number[]).includes(data.terminationTempRatingCelsius)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["terminationTempRatingCelsius"],
        message: "Must be 60, 75, or 90",
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
export type MotorFlcFormInput = z.input<typeof motorFlcSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type MotorFlcFormValues = z.output<typeof motorFlcSchema>;
