/**
 * This whole feature works in psi and GPM throughout, deliberately no unit-string fields —
 * mirrors calc-core's mechanical.firepump package Javadoc (NFPA 20 convention), unlike
 * mechanical.pipe's *Unit fields.
 */

/** Mirrors calc-api's SuctionConditionDto enum. */
export const SUCTION_CONDITIONS = ["FLOODED", "LIFT"] as const;
export type SuctionCondition = (typeof SUCTION_CONDITIONS)[number];

/** Mirrors calc-api's FirePumpDemandRequest field-for-field. */
export interface FirePumpDemandRequest {
  requiredFlowGpm: number;
  requiredPressurePsiAtDemandPoint: number;
  suctionCondition: SuctionCondition;
  availableSuctionPressurePsi: number | null;
  suctionLiftFeet: number | null;
  safetyMarginPercent: number | null;
}

/** Mirrors calc-api's FirePumpDemandResponse field-for-field. */
export interface FirePumpDemandResponse {
  ratedFlowGpm: number;
  ratedPressurePsi: number;
}

/** Mirrors calc-api's FirePumpCapacityRequest field-for-field. */
export interface FirePumpCapacityRequest {
  ratedFlowGpm: number;
}

/** Mirrors calc-api's FirePumpCapacityResponse field-for-field. */
export interface FirePumpCapacityResponse {
  standardFlowGpm: number;
}

/** Mirrors calc-api's PumpCurvePointDto field-for-field — shared by curve-validation and power. */
export interface PumpCurvePoint {
  flowGpm: number;
  pressurePsi: number;
}

/** Mirrors calc-api's FirePumpCurveValidationRequest field-for-field. */
export interface FirePumpCurveValidationRequest {
  candidateRatedFlowGpm: number;
  candidateRatedPressurePsi: number;
  curvePoints: PumpCurvePoint[];
  demandFlowGpm: number;
  demandPressurePsi: number;
}

/** Mirrors calc-api's FirePumpCurveValidationResponse field-for-field. */
export interface FirePumpCurveValidationResponse {
  meetsCapacityDemand: boolean;
  churnPressurePsi: number;
  churnCompliant: boolean;
  overloadPressurePsi: number;
  overloadCompliant: boolean;
  overallCompliant: boolean;
}

/** Mirrors calc-api's FirePumpPowerInputTypeDto enum. */
export const FIRE_PUMP_POWER_INPUT_TYPES = ["RATED_POINT_ONLY", "FULL_CURVE"] as const;
export type FirePumpPowerInputType = (typeof FIRE_PUMP_POWER_INPUT_TYPES)[number];

/**
 * Mirrors calc-api's FirePumpPowerRequest field-for-field. `pumpEfficiency` is a fraction in
 * (0, 1] on the wire (calc-core's compact constructor rejects anything else) — the form
 * collects a 0-100 percentage and divides by 100 before building this request.
 */
export interface FirePumpPowerRequest {
  inputType: FirePumpPowerInputType;
  flowGpm: number | null;
  pressurePsi: number | null;
  curveRatedFlowGpm: number | null;
  curveRatedPressurePsi: number | null;
  curvePoints: PumpCurvePoint[] | null;
  pumpEfficiency: number;
  specificGravity: number | null;
}

/** Mirrors calc-api's PowerAtPointDto field-for-field. */
export interface PowerAtPoint {
  flowGpm: number;
  pressurePsi: number;
  waterHorsepower: number;
  brakeHorsepower: number;
}

/**
 * Mirrors calc-api's FirePumpPowerResponse field-for-field. `recommendedElectricMotorSize` is
 * always populated by this endpoint (it only ever sizes an electric driver — diesel isn't
 * exposed); `driverSizingNote` carries the rated-point-only overload-not-evaluated caveat and
 * is null for full-curve requests.
 */
export interface FirePumpPowerResponse {
  evaluatedPoints: PowerAtPoint[];
  maxBrakeHorsepower: number;
  recommendedElectricMotorSize: string | null;
  driverSizingNote: string | null;
}
