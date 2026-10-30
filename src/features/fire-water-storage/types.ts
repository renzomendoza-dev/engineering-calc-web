/** Mirrors calc-api's HazardClassificationDto enum. */
export const HAZARD_CLASSIFICATIONS = ["LIGHT_HAZARD", "ORDINARY_HAZARD", "EXTRA_HAZARD"] as const;
export type HazardClassification = (typeof HAZARD_CLASSIFICATIONS)[number];

export const HAZARD_CLASSIFICATION_LABELS: Record<HazardClassification, string> = {
  LIGHT_HAZARD: "Light Hazard",
  ORDINARY_HAZARD: "Ordinary Hazard",
  EXTRA_HAZARD: "Extra Hazard",
};

/**
 * Mirrors calc-core's reference/storage/fire-water-duration.json exactly (NFPA 13 2019
 * edition, Table 19.3.3.1.2 — confirmed "verified" confidence, not a placeholder like the
 * domestic occupancy data). No reference endpoint exposes this, so it's a client-side
 * constant — kept in sync manually with the JSON if the backend data ever changes. Light
 * Hazard has no ambiguity (fixed 30 minutes, min==max).
 */
export const HAZARD_DURATION_RANGES: Record<
  HazardClassification,
  { minMinutes: number; maxMinutes: number }
> = {
  LIGHT_HAZARD: { minMinutes: 30, maxMinutes: 30 },
  ORDINARY_HAZARD: { minMinutes: 60, maxMinutes: 90 },
  EXTRA_HAZARD: { minMinutes: 90, maxMinutes: 120 },
};

/**
 * Mirrors calc-api's FireWaterStorageRequest field-for-field. GPM/gallons/minutes throughout
 * — deliberately NOT SI, matching calc-core's FireWaterStorageCalculator convention, unlike
 * Domestic Water Storage's SI units. selectedDurationMinutes is nullable: null means "use the
 * conservative max of the resolved range".
 */
export interface FireWaterStorageRequest {
  ratedPumpFlowGpm: number;
  hazardClassification: HazardClassification;
  selectedDurationMinutes: number | null;
  safetyMarginPercent: number;
}

/**
 * Mirrors calc-api's FireWaterDurationEntryDto field-for-field — one row of
 * reference/storage/fire-water-duration.json (NFPA 13 2019, Table 19.3.3.1.2).
 */
export interface FireWaterDurationTableRow {
  hazardClassification: HazardClassification;
  minMinutes: number;
  maxMinutes: number;
  hoseStreamAllowanceGpm: number;
}

/** Mirrors calc-api's FireWaterStorageResponse field-for-field. */
export interface FireWaterStorageResponse {
  resolvedDurationMinutesMin: number;
  resolvedDurationMinutesMax: number;
  durationMinutesUsed: number;
  usedConservativeDefault: boolean;
  requiredStorageVolumeGallons: number;
}
