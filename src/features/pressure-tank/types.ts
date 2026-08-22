export const PUMP_CONTROL_TYPES = ["CONVENTIONAL", "VFD"] as const;
export type PumpControlType = (typeof PUMP_CONTROL_TYPES)[number];

/** Mirrors calc-api's PressureTankRequest field-for-field. */
export interface PressureTankRequest {
  controlType: PumpControlType;
  drawdownFlowRateLpm: number;
  minRunTimeMinutes: number;
  lowPressureGaugeKpa: number;
  highPressureGaugeKpa: number;
  altitudeMeters: number;
}

/** Mirrors calc-api's PressureTankResponse field-for-field. */
export interface PressureTankResponse {
  drawdownVolumeLiters: number;
  requiredTankVolumeLiters: number;
  lowPressureAbsoluteKpa: number;
  highPressureAbsoluteKpa: number;
}
