/** Mirrors calc-api's PumpPowerRequest field-for-field. */
export interface PumpPowerRequest {
  flowRateValue: number;
  flowRateUnit: string;
  totalDynamicHeadMeters: number;
  pumpEfficiency: number;
  fluidDensityKgM3: number;
}

/** Mirrors calc-api's PumpPowerResponse field-for-field. */
export interface PumpPowerResponse {
  hydraulicPowerKw: number;
  shaftPowerKw: number;
  recommendedMotorSizeKw: string;
}
