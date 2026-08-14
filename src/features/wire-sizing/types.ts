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

/** Mirrors calc-api's WireSizingRequest field-for-field. */
export interface WireSizingRequest {
  loadCurrentAmps: number;
  isContinuousLoad: boolean;
  ambientTempCelsius: number;
  numberOfCurrentCarryingConductors: number;
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

/** Mirrors calc-api's WireSizingResponse field-for-field. */
export interface WireSizingResponse {
  recommendedSizeLabel: string;
  baseAmpacityAmps: number;
  tempCorrectionFactor: number;
  adjustmentFactor: number;
  deratedAmpacityAmps: number;
  requiredAmpacityAmps: number;
  meetsTerminationRating: boolean;
  voltageDropCheckResult: VoltageDropCheckResult | null;
}
