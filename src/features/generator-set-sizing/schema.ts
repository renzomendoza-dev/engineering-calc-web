import { z } from "zod";
import { optionalNumber, requiredNumber } from "@/lib/zodHelpers";
import { TERMINATION_TEMP_RATINGS } from "@/features/wire-sizing/types";
import {
  DIRECT_LOAD_UNITS,
  GENERATOR_PHASE_TYPES,
  LOAD_ENTRY_MODES,
  OPTIONAL_STANDBY_CLASS,
  PUMP_ENTRY_MODES,
} from "./types";

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
  startStep: requiredNumber(
    z.coerce.number("Required").int("Must be a whole number").min(1, "Must be at least 1"),
  ),
  startingCurrentPercent: requiredNumber(
    z.coerce.number("Required").positive("Must be positive").max(100, "At most 100"),
  ),
});

const directLoadSchema = z.object({
  label: z.string(),
  amount: requiredNumber(z.coerce.number("Required").positive("Must be positive")),
  unit: z.enum(DIRECT_LOAD_UNITS),
  powerFactor: optionalNumber(z.coerce.number().positive("Must be positive").max(1, "At most 1")),
  continuous: z.boolean(),
});

/**
 * A pump entered one of two ways: from the PEC horsepower tables (`horsepowerLabel` and `voltage`)
 * or as the currents from its controller (`fullLoadAmps`, and `lockedRotorAmps` for the fire pump
 * motor). Which fields are needed follows `entry`; superRefine below asks for them.
 */
const pumpMotorSchema = z.object({
  entry: z.enum(PUMP_ENTRY_MODES),
  horsepowerLabel: z.string(),
  voltage: optionalNumber(
    z.coerce.number().int("Must be a whole number").positive("Must be positive"),
  ),
  fullLoadAmps: optionalNumber(z.coerce.number().positive("Must be positive")),
  lockedRotorAmps: optionalNumber(z.coerce.number().positive("Must be positive")),
});

const outputConductorSchema = z.object({
  ambientTempCelsius: z.coerce.number(),
  numberOfCurrentCarryingConductors: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  numberOfParallelSets: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  insulationType: z.string(),
  conductorMaterial: z.string(),
  terminationTempRatingCelsius: z.coerce.number().optional(),
});

/** The run to the fire pump controller: the conductor conditions, and optionally its voltage drop. */
const supplyRunSchema = outputConductorSchema.extend({
  checkVoltageDrop: z.boolean(),
  oneWayLengthMeters: optionalNumber(z.coerce.number().positive("Must be positive")),
  conduitMaterial: z.string(),
  startingPowerFactor: optionalNumber(
    z.coerce.number().positive("Must be positive").max(1, "At most 1"),
  ),
  runningPowerFactor: optionalNumber(
    z.coerce.number().positive("Must be positive").max(1, "At most 1"),
  ),
  cableStartingDropAllowancePercent: optionalNumber(
    z.coerce.number().positive("Must be positive").lt(15, "Must be below 15"),
  ),
});

const firePumpSchema = z.object({
  motor: pumpMotorSchema,
  includeJockey: z.boolean(),
  jockey: pumpMotorSchema,
  accessoryAmps: optionalNumber(z.coerce.number().min(0, "Cannot be negative")),
  startStep: requiredNumber(
    z.coerce.number("Required").int("Must be a whole number").min(1, "Must be at least 1"),
  ),
  startingCurrentPercent: requiredNumber(
    z.coerce.number("Required").positive("Must be positive").max(100, "At most 100"),
  ),
  sizeSupplyRun: z.boolean(),
  supplyRun: supplyRunSchema,
});

export const generatorSetSchema = z
  .object({
    standbyClass: z.string().min(1, "Select the standby class"),
    loadEntryMode: z.enum(LOAD_ENTRY_MODES),
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
    directLoads: z.array(directLoadSchema),
    generatorPowerFactor: z.coerce.number().positive("Must be greater than 0").max(1, "At most 1"),
    spareCapacityPercent: z.coerce.number().min(0, "Cannot be negative"),
    selectedGeneratorKva: optionalNumber(z.coerce.number().positive("Must be positive")),
    designPreventsOverload: z.boolean(),
    sizeOutputConductor: z.boolean(),
    outputConductor: outputConductorSchema,
    includeFirePump: z.boolean(),
    firePump: firePumpSchema,
    subtransientReactancePercent: optionalNumber(
      z.coerce.number().positive("Must be positive").max(100, "At most 100"),
    ),
    maximumVoltageDipPercent: optionalNumber(
      z.coerce.number().positive("Must be positive").lt(100, "Must be below 100"),
    ),
  })
  .superRefine((data, ctx) => {
    const hasReactance = data.subtransientReactancePercent !== undefined;
    const hasDip = data.maximumVoltageDipPercent !== undefined;
    if (hasReactance !== hasDip) {
      ctx.addIssue({
        code: "custom",
        path: [hasReactance ? "maximumVoltageDipPercent" : "subtransientReactancePercent"],
        message: "Enter both to check motor starting, or neither to skip it",
      });
    }

    if (data.standbyClass === OPTIONAL_STANDBY_CLASS && !data.optionalTransfer) {
      ctx.addIssue({
        code: "custom",
        path: ["optionalTransfer"],
        message: "Select how load is transferred",
      });
    }

    data.directLoads.forEach((load, index) => {
      if (load.unit === "KW" && load.powerFactor === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["directLoads", index, "powerFactor"],
          message: "Required for a load in kW",
        });
      }
    });

    // Only the loads of the entry mode in use count (activeLoadsOnly empties the other lists); a fire
    // pump counts in either, and is enough on its own.
    if (data.loadEntryMode === "DIRECT") {
      if (data.directLoads.length === 0 && !data.includeFirePump) {
        ctx.addIssue({
          code: "custom",
          path: ["directLoads"],
          message: "Add the total load of the building, or a fire pump",
        });
      }
    } else if (
      data.lightingAreas.length +
        data.receptacleGroups.length +
        data.otherLoads.length +
        data.motors.length ===
        0 &&
      !data.includeFirePump
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["lightingAreas"],
        message:
          "Add at least one load: lighting, receptacles, another load, a motor or a fire pump",
      });
    }

    if (data.sizeOutputConductor) {
      checkConductor(ctx, ["outputConductor"], data.outputConductor);
    }

    if (data.includeFirePump) {
      const pump = data.firePump;
      checkPump(ctx, ["firePump", "motor"], pump.motor);
      if (pump.includeJockey) {
        checkPump(ctx, ["firePump", "jockey"], pump.jockey);
      }
      if (pump.sizeSupplyRun) {
        const run = pump.supplyRun;
        checkConductor(ctx, ["firePump", "supplyRun"], run);
        if (run.checkVoltageDrop) {
          const required = (field: string, value: number | undefined) => {
            if (value === undefined) {
              ctx.addIssue({
                code: "custom",
                path: ["firePump", "supplyRun", field],
                message: "Required for the voltage drop check",
              });
            }
          };
          required("oneWayLengthMeters", run.oneWayLengthMeters);
          required("startingPowerFactor", run.startingPowerFactor);
          required("runningPowerFactor", run.runningPowerFactor);
          required("cableStartingDropAllowancePercent", run.cableStartingDropAllowancePercent);
          if (!run.conduitMaterial) {
            ctx.addIssue({
              code: "custom",
              path: ["firePump", "supplyRun", "conduitMaterial"],
              message: "Conduit material is required for the voltage drop check",
            });
          }
        }
      }
    }
  });

/** The conductor conditions every sized run needs; blank selections are reported against their field. */
function checkConductor(
  ctx: z.RefinementCtx,
  path: string[],
  conductor: z.infer<typeof outputConductorSchema>,
) {
  if (!conductor.insulationType) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "insulationType"],
      message: "Insulation type is required",
    });
  }
  if (!conductor.conductorMaterial) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "conductorMaterial"],
      message: "Conductor material is required",
    });
  }
  const rating = conductor.terminationTempRatingCelsius;
  if (rating === undefined || !(TERMINATION_TEMP_RATINGS as readonly number[]).includes(rating)) {
    ctx.addIssue({
      code: "custom",
      path: [...path, "terminationTempRatingCelsius"],
      message: "Select a termination temperature rating",
    });
  }
}

/** A pump needs the fields of the way it is entered: horsepower and voltage, or its full-load current. */
function checkPump(ctx: z.RefinementCtx, path: string[], pump: z.infer<typeof pumpMotorSchema>) {
  if (pump.entry === "HORSEPOWER") {
    if (!pump.horsepowerLabel) {
      ctx.addIssue({
        code: "custom",
        path: [...path, "horsepowerLabel"],
        message: "Select a horsepower",
      });
    }
    if (pump.voltage === undefined) {
      ctx.addIssue({ code: "custom", path: [...path, "voltage"], message: "Select a voltage" });
    }
  } else if (pump.fullLoadAmps === undefined) {
    ctx.addIssue({ code: "custom", path: [...path, "fullLoadAmps"], message: "Required" });
  }
}

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type GeneratorSetFormInput = z.input<typeof generatorSetSchema>;

/**
 * The form keeps both ways of entering the load while the user switches between them, but only
 * the one in use is validated and sent: the other's lists are emptied here, so half-filled rows
 * left behind in a hidden list neither block the calculation nor reach the API.
 */
export function activeLoadsOnly(values: GeneratorSetFormInput): GeneratorSetFormInput {
  if (values.loadEntryMode === "DIRECT") {
    return { ...values, lightingAreas: [], receptacleGroups: [], otherLoads: [], motors: [] };
  }
  return { ...values, directLoads: [] };
}

/** Post-coercion/validation shape handed to the submit handler. */
export type GeneratorSetFormValues = z.output<typeof generatorSetSchema>;
