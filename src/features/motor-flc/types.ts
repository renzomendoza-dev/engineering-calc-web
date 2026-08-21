import type { ConductorMaterial } from "@/features/voltage-drop/types";
import type { VoltageDropCheckRequest, WireSizingResponse } from "@/features/wire-sizing/types";

/** Mirrors calc-api's MotorFlcRequest field-for-field. */
export interface MotorFlcRequest {
  phaseType: string;
  motorClass: string | null;
  horsepowerLabel: string;
  voltage: number;
  synchronousPowerFactorPercent: number | null;
}

/** Mirrors calc-api's MotorFlcResponse field-for-field. */
export interface MotorFlcResponse {
  flcAmps: number;
  baseFlcAmps: number;
  minimumConductorAmpacity: number;
}

/**
 * Mirrors calc-api's MotorConductorSizingRequest field-for-field. Reuses
 * VoltageDropCheckRequest from the wire-sizing feature directly, same as the backend reuses
 * VoltageDropCheckRequestDto from its wiresizing package rather than redefining it.
 *
 * Note calc-core's MotorConductorSizingInput compact constructor: motorClass must be null
 * when phaseType isn't "THREE_PHASE" (not just omitted or empty), and
 * synchronousPowerFactorPercent must be null unless motorClass is "SYNCHRONOUS" — both are
 * enforced client-side by schema.ts's superRefine, not just this type's nullability.
 */
export interface MotorConductorSizingRequest {
  phaseType: string;
  motorClass: string | null;
  horsepowerLabel: string;
  voltage: number;
  synchronousPowerFactorPercent: number | null;
  ambientTempCelsius: number;
  numberOfCurrentCarryingConductors: number;
  numberOfParallelSets: number;
  insulationType: string;
  conductorMaterial: ConductorMaterial;
  terminationTempRatingCelsius: number;
  voltageDropCheck: VoltageDropCheckRequest | null;
}

/**
 * Mirrors calc-api's MotorConductorSizingResponse field-for-field. Reuses WireSizingResponse
 * directly from the wire-sizing feature, same as the backend reuses its WireSizingResponse
 * type rather than redefining an equivalent shape here.
 */
export interface MotorConductorSizingResponse {
  motorFlcResult: MotorFlcResponse;
  wireSizingResult: WireSizingResponse;
}

/**
 * Discriminates which endpoint/response shape a MotorFlcForm submission produced, so
 * MotorFlcResults knows whether to render just the FLC portion or the FLC + wire sizing
 * pipeline portion.
 */
export type MotorFlcFormResult =
  | { kind: "flc"; data: MotorFlcResponse }
  | { kind: "pipeline"; data: MotorConductorSizingResponse };

/**
 * Mirrors calc-api's MotorFlcEntryDto field-for-field — one row of the combined PEC Article
 * 4.30 full-load current tables (4.30.14.1 through 4.30.14.4), as published. motorClass is
 * null except for three-phase rows.
 */
export interface MotorFlcTableRow {
  phaseType: string;
  motorClass: string | null;
  sizeLabel: string;
  voltage: number;
  flcAmps: number;
}
