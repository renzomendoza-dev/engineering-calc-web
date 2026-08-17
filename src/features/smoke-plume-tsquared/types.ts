/** Mirrors calc-api's TSquaredPlumeRegimeTypeDto enum. */
export type TSquaredPlumeRegimeType = "NEAR_FIELD" | "FAR_FIELD";

/**
 * Mirrors calc-api's TSquaredPlumeRegimeDto field-for-field. Deliberate duplicate of the
 * non-t-squared PlumeRegime type in the sibling smoke-plume feature — kept separate to match
 * the "fully separate, duplicated" decision already made at the core/API layers, not shared
 * between the two calculators.
 */
export interface TSquaredPlumeRegime {
  type: TSquaredPlumeRegimeType;
  massFlowRate: number;
}

/**
 * Mirrors calc-api's TSquaredSmokeProductionRequest field-for-field. convectiveFraction,
 * fireBaseHeight, and fractionConvectiveHeatInSmokeLayer are nullable: when omitted,
 * TSquaredSmokeProductionService lets calc-core apply its own SmokeControlDefaultsResolver-
 * sourced default (chi=0.7, Ks=1.0) or fixed default (fireBaseHeight=0), same as the sibling
 * smoke-plume feature's request. evaluationTime allows 0 (a valid evaluation point).
 */
export interface TSquaredSmokeProductionRequest {
  fireGrowthRate: number;
  cappingHRR: number;
  evaluationTime: number;
  convectiveFraction: number | null;
  ceilingHeight: number;
  fireBaseHeight: number | null;
  ambientTemperature: number;
  fractionConvectiveHeatInSmokeLayer: number | null;
}

/**
 * Mirrors calc-api's TSquaredSmokeProductionResponse field-for-field. Every intermediate
 * value from the NFPA 92 calculation sequence is exposed, plus the growth-specific
 * evaluationTime/isGrowthCapped fields that have no equivalent in the sibling calculator's
 * response.
 */
export interface TSquaredSmokeProductionResponse {
  evaluationTime: number;
  designHeatReleaseRate: number;
  isGrowthCapped: boolean;
  convectiveHeatReleaseRate: number;
  flameHeight: number;
  heightAboveFire: number;
  plumeRegime: TSquaredPlumeRegime;
  smokeTemperature: number;
  smokeDensity: number;
  volumetricFlowRate: number;
}
