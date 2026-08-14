import { z } from "zod";
import { CIRCUIT_TYPES, CONDUCTOR_MATERIALS, CONDUIT_MATERIALS } from "./types";

/**
 * Mirrors the backend's validation rules exactly, so the client rejects the same inputs
 * the server would:
 *  - Bean Validation on VoltageDropRequest (calc-api), notably
 *    VoltageDropRequest.isImpedanceSelectionValid(): when useCustomImpedance is true,
 *    customResistanceOhmsPerMeter (positive) and customReactanceOhmsPerMeter (>= 0) are
 *    required; when false, conductorSizeLabel and conductorMaterial are required, plus
 *    conduitMaterial unless circuitType is DC.
 *  - the compact-constructor checks on VoltageDropInput (calc-core): powerFactor must be
 *    in (0, 1] for AC, and reactanceOhmsPerMeter (here, customReactanceOhmsPerMeter in
 *    custom-impedance mode) must be 0 for DC — VoltageDropService resolves reference-table
 *    reactance itself, so that half of the rule doesn't need mirroring here.
 *
 * This is the single source of truth for client-side validation — no validation logic
 * lives in the form component itself.
 *
 * powerFactor, and every impedance-mode field not relevant to the current
 * useCustomImpedance/circuitType combination, are `.optional()`: those fields are hidden
 * (unmounted) rather than just disabled in VoltageDropForm, and react-hook-form drops
 * unmounted fields from the submitted values. The superRefine below treats a missing
 * value as "not yet filled in" for whichever fields are actually required in the current
 * mode.
 */
export const voltageDropSchema = z
  .object({
    circuitType: z.enum(CIRCUIT_TYPES, "Circuit type is required"),
    currentAmps: z.coerce.number().positive("Must be positive"),
    oneWayLengthMeters: z.coerce.number().positive("Must be positive"),
    powerFactor: z.coerce
      .number()
      .min(0, "Must be between 0 and 1")
      .max(1, "Must be between 0 and 1")
      .optional(),
    systemVoltage: z.coerce.number().positive("Must be positive"),
    parallelSetsPerPhase: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
    useCustomImpedance: z.boolean(),
    conductorSizeLabel: z.string().optional(),
    conductorMaterial: z.union([z.enum(CONDUCTOR_MATERIALS), z.literal("")]).optional(),
    conduitMaterial: z.union([z.enum(CONDUIT_MATERIALS), z.literal("")]).optional(),
    customResistanceOhmsPerMeter: z.coerce.number().optional(),
    customReactanceOhmsPerMeter: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.circuitType !== "DC") {
      if (data.powerFactor === undefined || data.powerFactor <= 0 || data.powerFactor > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["powerFactor"],
          message: "Must be greater than 0 for AC circuits",
        });
      }
    }

    if (data.useCustomImpedance) {
      if (data.customResistanceOhmsPerMeter === undefined || data.customResistanceOhmsPerMeter <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["customResistanceOhmsPerMeter"],
          message: "Must be positive",
        });
      }
      if (data.customReactanceOhmsPerMeter === undefined || data.customReactanceOhmsPerMeter < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["customReactanceOhmsPerMeter"],
          message: "Cannot be negative",
        });
      } else if (data.circuitType === "DC" && data.customReactanceOhmsPerMeter !== 0) {
        ctx.addIssue({
          code: "custom",
          path: ["customReactanceOhmsPerMeter"],
          message: "Must be 0 for DC circuits",
        });
      }
    } else {
      if (!data.conductorSizeLabel) {
        ctx.addIssue({
          code: "custom",
          path: ["conductorSizeLabel"],
          message: "Conductor size is required",
        });
      }
      if (!data.conductorMaterial) {
        ctx.addIssue({
          code: "custom",
          path: ["conductorMaterial"],
          message: "Conductor material is required",
        });
      }
      if (data.circuitType !== "DC" && !data.conduitMaterial) {
        ctx.addIssue({
          code: "custom",
          path: ["conduitMaterial"],
          message: "Conduit material is required",
        });
      }
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type VoltageDropFormInput = z.input<typeof voltageDropSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type VoltageDropFormValues = z.output<typeof voltageDropSchema>;
