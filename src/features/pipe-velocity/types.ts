import type { DiameterSpecType } from "@/lib/diameterSpec";

/** Mirrors calc-api's PipeSizingModeDto enum. */
export const PIPE_SIZING_MODES = ["VELOCITY_FROM_DIAMETER", "DIAMETER_FROM_VELOCITY"] as const;
export type PipeSizingMode = (typeof PIPE_SIZING_MODES)[number];

/**
 * Mirrors calc-api's PipeVelocityRequest field-for-field.
 *
 * `nominalLabel` here is NOT the reference data's human-readable `nominalLabel` field — the
 * backend expects the machine-friendly `nominalSize` key (e.g. "2", "1-1/4") in this field.
 * See calc-core's `NominalSize` Javadoc for this naming gotcha; `PipeSizeOption` below keeps
 * the two fields distinct so the form doesn't repeat the confusion.
 */
export interface PipeVelocityRequest {
  mode: PipeSizingMode;
  flowRateValue: number;
  flowRateUnit: string;
  diameterSpecType: DiameterSpecType | null;
  nominalMaterial: string | null;
  nominalSchedule: string | null;
  nominalLabel: string | null;
  rawDiameterValue: number | null;
  rawDiameterUnit: string | null;
  targetVelocityValue: number | null;
  targetVelocityUnit: string | null;
  pipeMaterial: string | null;
  schedule: string | null;
}

/**
 * Mirrors calc-api's PipeVelocityResponse field-for-field. Which fields are non-null depends
 * on `mode` — see the backend record's Javadoc.
 */
export interface PipeVelocityResponse {
  mode: PipeSizingMode;
  velocityValue: number | null;
  velocityUnit: string | null;
  calculatedMinDiameterValue: number | null;
  calculatedMinDiameterUnit: string | null;
  nominalPipeSize: string | null;
  actualInternalDiameterValue: number | null;
  actualInternalDiameterUnit: string | null;
  actualVelocityValue: number | null;
  actualVelocityUnit: string | null;
}

/** Mirrors calc-api's PipeSizeDto field-for-field. */
export interface PipeSizeOption {
  nominalSize: string;
  nominalLabel: string;
  internalDiameterMm: number;
}

/** Mirrors calc-api's PipeScheduleDto field-for-field. */
export interface PipeScheduleOption {
  schedule: string;
  sizes: PipeSizeOption[];
}

/**
 * Mirrors calc-api's PipeMaterialDto field-for-field. `confidence` is `"verified"` or
 * `"placeholder"` (currently uPVC and PPR) — show a caveat near the dropdown for
 * `"placeholder"` materials rather than hiding it.
 */
export interface PipeMaterialOption {
  material: string;
  materialName: string;
  confidence: string;
  schedules: PipeScheduleOption[];
}
