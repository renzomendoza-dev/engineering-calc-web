/**
 * Mirrors calc-api's VentAreaRequest field-for-field. Standalone -- does not reference or
 * embed a result from either smoke production endpoint; the caller supplies plain values
 * directly (which may have come from either smoke production calculator's results, via the
 * "Send to Vent Sizing" query-param forward, or from anywhere else), same decoupling decision
 * made at the core/API layers. dischargeCoefficient is nullable: when omitted,
 * VentAreaService lets calc-core apply its own SmokeControlDefaultsResolver-sourced default
 * (Cd=0.6).
 */
export interface VentAreaRequest {
  volumetricFlowRate: number;
  smokeTemperature: number;
  ambientTemperature: number;
  ventHeight: number;
  dischargeCoefficient: number | null;
}

/**
 * Mirrors calc-api's VentAreaResponse field-for-field. Both the intermediate
 * temperatureDifference and the final requiredVentArea are exposed, not just the area,
 * consistent with how the Smoke Production calculators expose every intermediate value.
 */
export interface VentAreaResponse {
  temperatureDifference: number;
  requiredVentArea: number;
}
