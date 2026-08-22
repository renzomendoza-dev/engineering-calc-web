export const SYSTEM_TYPES = ["DOMESTIC_WATER_HEATER", "HYDRONIC_HEATING"] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number];

/** Mirrors calc-api's ExpansionTankRequest field-for-field. */
export interface ExpansionTankRequest {
  systemType: SystemType;
  primaryVesselVolumeLiters: number;
  estimatedPipingLengthMeters: number;
  averagePipeDiameterMm: number;
  additionalVolumeFactor: number | null;
  coldWaterTemperatureCelsius: number;
  hotWaterTemperatureCelsius: number;
  fillPressureGaugeKpa: number;
  maxOperatingPressureGaugeKpa: number;
  altitudeMeters: number;
}

/** Mirrors calc-api's ExpansionTankResponse field-for-field. */
export interface ExpansionTankResponse {
  derivedSystemVolumeLiters: number;
  expansionVolumeLiters: number;
  requiredTankVolumeLiters: number;
  coldWaterDensityKgM3: number;
  hotWaterDensityKgM3: number;
  fillPressureAbsoluteKpa: number;
  maxOperatingPressureAbsoluteKpa: number;
}
