import type { CircuitType, ConductorMaterial, ConduitMaterial } from "@/features/voltage-drop/types";

/**
 * Wire sizing's termination temperature ratings — fixed at exactly {60, 75, 90} by
 * definition (see calc-api's ConductorReferenceService.listTerminationTempRatings and
 * calc-core's WireSizingInput validation, both of which hardcode this same set). Mirrors
 * the CIRCUIT_TYPES/CONDUCTOR_MATERIALS pattern in voltage-drop/types.ts.
 */
export const TERMINATION_TEMP_RATINGS = [60, 75, 90] as const;

export type TerminationTempRating = (typeof TERMINATION_TEMP_RATINGS)[number];

/** Mirrors calc-api's VoltageDropCheckRequestDto field-for-field. */
export interface VoltageDropCheckRequest {
  circuitType: CircuitType;
  oneWayLengthMeters: number;
  powerFactor: number;
  systemVoltage: number;
  conduitMaterial: ConduitMaterial;
  parallelSetsPerPhase: number;
}

/**
 * Mirrors calc-api's WireSizingRequest field-for-field.
 *
 * numberOfParallelSets is how many identical conductors run in parallel to carry this one
 * circuit's current (e.g. 2 smaller conductors instead of one too large to be practical, or
 * unavailable) — independent of VoltageDropCheckRequest's own parallelSetsPerPhase, which
 * feeds a separate voltage-drop calculation and isn't derived from this field.
 */
export interface WireSizingRequest {
  loadCurrentAmps: number;
  isContinuousLoad: boolean;
  ambientTempCelsius: number;
  numberOfCurrentCarryingConductors: number;
  numberOfParallelSets: number;
  insulationType: string;
  conductorMaterial: ConductorMaterial;
  terminationTempRatingCelsius: number;
  voltageDropCheck: VoltageDropCheckRequest | null;
}

/** Mirrors calc-api's VoltageDropCheckResponseDto field-for-field. */
export interface VoltageDropCheckResult {
  sizeLabelChecked: string;
  voltageDropPercent: number;
  exceedsRecommendedLimit: boolean;
  upsizedRecommendation: string | null;
}

/**
 * Mirrors calc-api's WireSizingResponse field-for-field.
 *
 * recommendedSizeLabel is the size of ONE conductor — when numberOfParallelSets > 1, the
 * caller needs that many of them, run in parallel, to carry the full load.
 * requiredAmpacityAmps is the TOTAL the full parallel set must carry together;
 * requiredAmpacityPerSetAmps (= requiredAmpacityAmps / numberOfParallelSets) is what each
 * individual conductor was actually sized against.
 */
export interface WireSizingResponse {
  recommendedSizeLabel: string;
  baseAmpacityAmps: number;
  tempCorrectionFactor: number;
  adjustmentFactor: number;
  deratedAmpacityAmps: number;
  requiredAmpacityAmps: number;
  numberOfParallelSets: number;
  requiredAmpacityPerSetAmps: number;
  meetsTerminationRating: boolean;
  voltageDropCheckResult: VoltageDropCheckResult | null;
}

/** Mirrors calc-api's AmpacityEntryDto field-for-field — one row of PEC Table 3.10.2.6(B)(16). */
export interface AmpacityTableRow {
  conductorMaterial: ConductorMaterial;
  sizeLabel: string;
  tempRatingCelsius: number;
  ampacityAmps: number;
}

/**
 * Mirrors calc-api's InsulationTypeTempRatingEntryDto field-for-field — which
 * {@link AmpacityTableRow} temperature column a given insulation type + material uses.
 */
export interface InsulationTypeTempRatingTableRow {
  insulationType: string;
  conductorMaterial: ConductorMaterial;
  tempRatingCelsius: number;
}

/**
 * Mirrors calc-api's AmbientTempCorrectionEntryDto field-for-field — one row of PEC Table
 * 3.10.2.6(B)(2)(a). factor60C/75C/90C are nullable — some ambient ranges have no published
 * factor for a given temperature rating.
 */
export interface AmbientTempCorrectionTableRow {
  ambientTempRangeLabel: string;
  ambientTempLowC: number | null;
  ambientTempHighC: number;
  factor60C: number | null;
  factor75C: number | null;
  factor90C: number | null;
}

/**
 * Mirrors calc-api's ConductorCountAdjustmentEntryDto field-for-field — one row of PEC Table
 * 3.10.2.6(B)(3)(a). conductorCountMax is nullable for the open-ended "41 and above" row.
 * adjustmentFactorPercent is the published percentage (e.g. 80), not yet divided by 100.
 */
export interface ConductorCountAdjustmentTableRow {
  conductorCountRangeLabel: string;
  conductorCountMin: number;
  conductorCountMax: number | null;
  adjustmentFactorPercent: number;
}
