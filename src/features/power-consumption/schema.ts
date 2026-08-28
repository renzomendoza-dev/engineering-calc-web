import { z } from "zod";
import { CIRCUIT_TYPES } from "@/features/voltage-drop/types";
import { optionalNumber } from "@/lib/zodHelpers";
import { POWER_INPUT_MODES } from "./types";

/**
 * Mirrors calc-core's PowerConsumptionInput compact constructor exactly, so the client
 * rejects the same inputs the server would: each mode requires its own fields (positive) and
 * forbids the other modes' fields outright (see PowerConsumptionForm's mode-change effect,
 * which clears them so they're never even submitted).
 *
 * wattageInput/circuitType/voltage/currentAmps/horsepowerInput are `.optional()` without the
 * optionalNumber blank-string helper: they're unmounted (not just hidden) outside their own
 * mode, so react-hook-form drops them from the submitted values entirely -- same reasoning as
 * duct sizing's shape/method-specific fields.
 *
 * powerFactor/motorEfficiencyPercent DO use optionalNumber: unlike the fields above, these
 * stay mounted while their mode is active and are genuinely meant to be left blank by the
 * user (the backend defaults them to 1.0 / 85 respectively) -- NumberField submits a blank
 * field as "", which optionalNumber treats as "not provided" rather than coercing to 0.
 *
 * runtimeEntryMode/hoursPerDay/numberOfDays are form-only fields, never sent to the backend
 * (see PowerConsumptionRequest, which only has totalOperatingHours) -- hoursPerDay/
 * numberOfDays are unmounted outside "helper" mode so plain `.optional()` suffices there too.
 */
export const powerConsumptionSchema = z
  .object({
    mode: z.enum(POWER_INPUT_MODES, "Input mode is required"),

    wattageInput: z.coerce.number().optional(),

    circuitType: z.union([z.enum(CIRCUIT_TYPES), z.literal("")]).optional(),
    voltage: z.coerce.number().optional(),
    currentAmps: z.coerce.number().optional(),
    powerFactor: optionalNumber(z.coerce.number()),

    horsepowerInput: z.coerce.number().optional(),
    motorEfficiencyPercent: optionalNumber(z.coerce.number()),

    runtimeEntryMode: z.enum(["simple", "helper"]),
    totalOperatingHours: z.coerce.number().positive("Must be positive"),
    hoursPerDay: z.coerce.number().optional(),
    numberOfDays: z.coerce.number().optional(),

    pricePerKwh: optionalNumber(z.coerce.number().positive("Must be positive")),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "DIRECT_WATTAGE") {
      if (data.wattageInput === undefined || data.wattageInput <= 0) {
        ctx.addIssue({ code: "custom", path: ["wattageInput"], message: "Must be positive" });
      }
    }

    if (data.mode === "VOLTAGE_CURRENT") {
      if (!data.circuitType) {
        ctx.addIssue({ code: "custom", path: ["circuitType"], message: "Circuit type is required" });
      }
      if (data.voltage === undefined || data.voltage <= 0) {
        ctx.addIssue({ code: "custom", path: ["voltage"], message: "Must be positive" });
      }
      if (data.currentAmps === undefined || data.currentAmps <= 0) {
        ctx.addIssue({ code: "custom", path: ["currentAmps"], message: "Must be positive" });
      }
      if (
        data.circuitType &&
        data.circuitType !== "DC" &&
        data.powerFactor !== undefined &&
        (data.powerFactor <= 0 || data.powerFactor > 1)
      ) {
        ctx.addIssue({ code: "custom", path: ["powerFactor"], message: "Must be greater than 0 and at most 1" });
      }
    }

    if (data.mode === "HORSEPOWER") {
      if (data.horsepowerInput === undefined || data.horsepowerInput <= 0) {
        ctx.addIssue({ code: "custom", path: ["horsepowerInput"], message: "Must be positive" });
      }
      if (
        data.motorEfficiencyPercent !== undefined &&
        (data.motorEfficiencyPercent <= 0 || data.motorEfficiencyPercent > 100)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["motorEfficiencyPercent"],
          message: "Must be greater than 0 and at most 100",
        });
      }
    }

    if (data.runtimeEntryMode === "helper") {
      if (data.hoursPerDay === undefined || data.hoursPerDay <= 0) {
        ctx.addIssue({ code: "custom", path: ["hoursPerDay"], message: "Must be positive" });
      }
      if (data.numberOfDays === undefined || data.numberOfDays <= 0) {
        ctx.addIssue({ code: "custom", path: ["numberOfDays"], message: "Must be positive" });
      }
    }
  });

/** Pre-coercion shape react-hook-form edits (numeric fields come in as strings). */
export type PowerConsumptionFormInput = z.input<typeof powerConsumptionSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type PowerConsumptionFormValues = z.output<typeof powerConsumptionSchema>;
