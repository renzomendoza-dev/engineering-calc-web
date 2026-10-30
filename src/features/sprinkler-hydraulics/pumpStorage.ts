import {
  HAZARD_CLASSIFICATION_LABELS,
  HAZARD_DURATION_RANGES,
  type HazardClassification,
} from "@/features/fire-water-storage/types";
import type { FireWaterStorageRequest } from "@/features/fire-water-storage/types";
import type {
  FirePumpCapacityRequest,
  FirePumpDemandRequest,
  SuctionCondition,
} from "@/features/firepump/types";
import type { SprinklerHazard } from "./types";

/**
 * Feeding the sprinkler calculation's result into the fire pump and fire water storage
 * calculators that already exist.
 *
 * Nothing here is hydraulics or sizing: it picks which of this form's figures go into which
 * field of those requests, and says what is still missing. The pump's rated flow and pressure, the
 * standard rating and the storage volume are all those calculators' answers.
 */

/**
 * The storage calculator's three classes against this form's five hazards. The standard's
 * duration table (11.2.3.1.2) is by light, ordinary and extra hazard; the groups within ordinary
 * and extra are a design-density distinction, not a different duration.
 */
export function hazardClassificationFor(hazard: SprinklerHazard): HazardClassification {
  switch (hazard) {
    case "LIGHT":
      return "LIGHT_HAZARD";
    case "ORDINARY_GROUP_1":
    case "ORDINARY_GROUP_2":
      return "ORDINARY_HAZARD";
    case "EXTRA_GROUP_1":
    case "EXTRA_GROUP_2":
      return "EXTRA_HAZARD";
  }
}

/** The published water supply duration range for a hazard, in minutes (NFPA 13 Table 19.3.3.1.2). */
export function durationRangeFor(hazard: SprinklerHazard): {
  minMinutes: number;
  maxMinutes: number;
} {
  return HAZARD_DURATION_RANGES[hazardClassificationFor(hazard)];
}

/**
 * What the storage duration field starts at for a hazard: the lowest of its range. Ordinary hazard
 * is 60 to 90 minutes, so it starts at 60; light hazard is a fixed 30.
 */
export function defaultStorageDurationMinutes(hazard: SprinklerHazard): number {
  return durationRangeFor(hazard).minMinutes;
}

/** An entered duration the standard's range does not allow, and what to tell the designer. */
export interface StorageDurationIssue {
  kind: "below" | "above";
  message: string;
}

/**
 * Whether the duration entered is outside the hazard's published range, which the storage
 * calculator refuses to size for. Below it is the case that matters (less water than the standard
 * asks the supply to last for); above it is not sized either, because the calculator works within
 * the range. A blank duration is no issue (it takes the top of the range), nor is a figure that is
 * not positive, which has its own message. A comparison of two figures, nothing more.
 */
export function storageDurationIssue(
  duration: unknown,
  hazard: SprinklerHazard,
): StorageDurationIssue | null {
  const minutes = toNumberOrNull(duration);
  if (minutes === null || minutes <= 0) return null;

  const { minMinutes, maxMinutes } = durationRangeFor(hazard);
  const label = HAZARD_CLASSIFICATION_LABELS[hazardClassificationFor(hazard)];
  const range =
    minMinutes === maxMinutes ? `a fixed ${minMinutes} min` : `${minMinutes} to ${maxMinutes} min`;

  if (minutes < minMinutes) {
    return {
      kind: "below",
      message: `${minutes} min is below the ${minMinutes} min NFPA 13 asks the water supply to last for ${label} (${range}, Table 19.3.3.1.2), so the storage volume is not worked out. Enter ${minMinutes} min or more.`,
    };
  }
  if (minutes > maxMinutes) {
    return {
      kind: "above",
      message: `${minutes} min is above the ${maxMinutes} min top of the ${label} range (${range}, Table 19.3.3.1.2), and the storage calculator works within that range, so the volume is not worked out. Enter ${maxMinutes} min or less.`,
    };
  }
  return null;
}

/** A form field read as a number, or null when it is blank or not a number. */
export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** What the pump section collects, as the form holds it (strings from number inputs). */
export interface PumpStorageInputs {
  suctionCondition: SuctionCondition;
  suctionPressurePsi: unknown;
  suctionLiftFt: unknown;
  pumpSafetyMarginPercent: unknown;
  storageDurationMinutes: unknown;
  storageSafetyMarginPercent: unknown;
}

/** A request that can be sent, or the reasons it can't be yet. */
export type Built<T> = { request: T; problems: [] } | { request: null; problems: string[] };

/**
 * The pump demand request: the sprinkler calculation's total demand and required pressure at the
 * supply, with the suction condition the designer states.
 */
export function buildPumpDemandRequest(
  inputs: PumpStorageInputs,
  demandFlowGpm: number,
  requiredPressurePsi: number,
): Built<FirePumpDemandRequest> {
  const problems: string[] = [];
  const flooded = inputs.suctionCondition === "FLOODED";
  const suctionPressure = toNumberOrNull(inputs.suctionPressurePsi);
  const lift = toNumberOrNull(inputs.suctionLiftFt);
  const margin = toNumberOrNull(inputs.pumpSafetyMarginPercent) ?? 0;

  if (flooded && suctionPressure === null) {
    problems.push("Enter the pressure available at the pump suction (0 if there is none).");
  }
  if (!flooded && lift === null) {
    problems.push("Enter the suction lift.");
  }
  if (!flooded && lift !== null && lift < 0) {
    problems.push("The suction lift cannot be negative.");
  }
  if (margin < 0) {
    problems.push("The pump safety margin cannot be negative.");
  }
  if (problems.length > 0) return { request: null, problems };

  return {
    request: {
      requiredFlowGpm: demandFlowGpm,
      requiredPressurePsiAtDemandPoint: requiredPressurePsi,
      suctionCondition: inputs.suctionCondition,
      availableSuctionPressurePsi: flooded ? suctionPressure : null,
      suctionLiftFeet: flooded ? null : lift,
      safetyMarginPercent: margin,
    },
    problems: [],
  };
}

/**
 * Whether the pressure already reaching the pump is at least what the system needs, so there is no
 * pressure for a pump to add. The pump demand calculator rejects that case (its rated pressure
 * would not be positive), and it is not an error: it is the answer for a supply that meets the
 * demand. A comparison of two figures, nothing more.
 */
export function pumpAddsNoPressure(
  inputs: PumpStorageInputs,
  requiredPressurePsi: number,
): boolean {
  if (inputs.suctionCondition !== "FLOODED") return false;
  const suctionPressure = toNumberOrNull(inputs.suctionPressurePsi);
  return suctionPressure !== null && suctionPressure >= requiredPressurePsi;
}

/** The standard rating for a rated flow. */
export function buildPumpCapacityRequest(ratedFlowGpm: number): FirePumpCapacityRequest {
  return { ratedFlowGpm };
}

/**
 * The storage request: sized for the standard pump rating, which is what the tank has to feed for
 * the duration. A blank duration is sent as null, which the API reads as the top of the hazard's
 * range.
 */
export function buildStorageRequest(
  inputs: PumpStorageInputs,
  hazard: SprinklerHazard,
  standardPumpFlowGpm: number,
): Built<FireWaterStorageRequest> {
  const problems: string[] = [];
  const duration = toNumberOrNull(inputs.storageDurationMinutes);
  const margin = toNumberOrNull(inputs.storageSafetyMarginPercent) ?? 0;

  if (duration !== null && duration <= 0) problems.push("The duration must be positive.");
  if (margin < 0) problems.push("The storage safety margin cannot be negative.");
  if (problems.length > 0) return { request: null, problems };
  // Outside the range there is nothing to send: the calculator would refuse. The page says why, as a
  // warning beside the field (storageDurationIssue), so no second message is added here.
  if (storageDurationIssue(inputs.storageDurationMinutes, hazard) !== null) {
    return { request: null, problems: [] };
  }

  return {
    request: {
      ratedPumpFlowGpm: standardPumpFlowGpm,
      hazardClassification: hazardClassificationFor(hazard),
      selectedDurationMinutes: duration,
      safetyMarginPercent: margin,
    },
    problems: [],
  };
}
