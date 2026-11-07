import type { FirePumpCapacityRequest, FirePumpDemandRequest, SuctionCondition } from "./types";

/**
 * Handing a calculated demand to the fire pump calculators that already exist, shared by the
 * calculations that do it (the sprinkler and standpipe tools).
 *
 * Nothing here is hydraulics or sizing: it picks which of a form's figures go into which field of
 * those requests, and says what is still missing. The pump's rated flow and pressure and the
 * standard rating are those calculators' answers.
 */

/** A form field read as a number, or null when it is blank or not a number. */
export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** What the pump section collects, as the form holds it (strings from number inputs). */
export interface PumpChainInputs {
  suctionCondition: SuctionCondition;
  suctionPressurePsi: unknown;
  suctionLiftFt: unknown;
  pumpSafetyMarginPercent: unknown;
}

/** A request that can be sent, or the reasons it can't be yet. */
export type Built<T> = { request: T; problems: [] } | { request: null; problems: string[] };

/**
 * The pump demand request: a calculation's total demand and required pressure at the supply, with
 * the suction condition the designer states.
 */
export function buildPumpDemandRequest(
  inputs: PumpChainInputs,
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
export function pumpAddsNoPressure(inputs: PumpChainInputs, requiredPressurePsi: number): boolean {
  if (inputs.suctionCondition !== "FLOODED") return false;
  const suctionPressure = toNumberOrNull(inputs.suctionPressurePsi);
  return suctionPressure !== null && suctionPressure >= requiredPressurePsi;
}

/** The standard rating for a rated flow. */
export function buildPumpCapacityRequest(ratedFlowGpm: number): FirePumpCapacityRequest {
  return { ratedFlowGpm };
}
