import type { CircuitType } from "@/features/voltage-drop/types";

export const POWER_INPUT_MODES = ["DIRECT_WATTAGE", "VOLTAGE_CURRENT", "HORSEPOWER"] as const;
export type PowerInputMode = (typeof POWER_INPUT_MODES)[number];

/** Mirrors calc-api's PowerConsumptionRequest field-for-field. */
export interface PowerConsumptionRequest {
  mode: PowerInputMode;
  wattageInput: number | null;
  circuitType: CircuitType | null;
  voltage: number | null;
  currentAmps: number | null;
  powerFactor: number | null;
  horsepowerInput: number | null;
  motorEfficiencyPercent: number | null;
  totalOperatingHours: number;
  pricePerKwh: number | null;
}

/** Mirrors calc-api's PowerConsumptionResponse field-for-field. */
export interface PowerConsumptionResponse {
  powerWatts: number;
  powerKw: number;
  energyConsumedKwh: number;
  estimatedCost: number | null;
  isEstimatedPower: boolean;
}
