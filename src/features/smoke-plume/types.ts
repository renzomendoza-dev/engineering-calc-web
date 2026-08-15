/** Mirrors calc-api's PlumeRegimeTypeDto enum. */
export type PlumeRegimeType = "NEAR_FIELD" | "FAR_FIELD";

/**
 * Mirrors calc-api's PlumeRegimeDto field-for-field — a small nested object with a `type`
 * discriminator, since NearField and FarField share one identical field (massFlowRate) with
 * no per-variant fields to null out.
 */
export interface PlumeRegime {
  type: PlumeRegimeType;
  massFlowRate: number;
}

/**
 * Mirrors calc-api's SmokeProductionRequest field-for-field. convectiveFraction,
 * fireBaseHeight, and fractionConvectiveHeatInSmokeLayer are nullable: when omitted,
 * SmokeProductionService lets calc-core apply its own SmokeControlDefaultsResolver-sourced
 * default (chi=0.7, Ks=1.0) or fixed default (fireBaseHeight=0) rather than this layer
 * guessing or pre-filling a value the user hasn't actually confirmed.
 */
export interface SmokeProductionRequest {
  designFireArea: number;
  heatReleaseRateDensity: number;
  convectiveFraction: number | null;
  ceilingHeight: number;
  fireBaseHeight: number | null;
  ambientTemperature: number;
  fractionConvectiveHeatInSmokeLayer: number | null;
}

/**
 * Mirrors calc-api's SmokeProductionResponse field-for-field. Every intermediate value from
 * the NFPA 92 calculation sequence is exposed, not just volumetricFlowRate, matching that
 * DTO's own design intent that the web layer surface each step.
 */
export interface SmokeProductionResponse {
  designHeatReleaseRate: number;
  convectiveHeatReleaseRate: number;
  flameHeight: number;
  heightAboveFire: number;
  plumeRegime: PlumeRegime;
  smokeTemperature: number;
  smokeDensity: number;
  volumetricFlowRate: number;
}
