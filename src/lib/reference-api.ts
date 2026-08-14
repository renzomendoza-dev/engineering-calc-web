import { apiGet } from "@/lib/api-client";
import type {
  ConductorDcResistanceTableRow,
  ConductorImpedanceTableRow,
  ConductorMaterial,
  ConductorSizeOption,
  ConduitMaterial,
} from "@/features/voltage-drop/types";
import type {
  ConductorDimensionTableRow,
  ConduitDimensionTableRow,
} from "@/features/conduit-fill/types";
import type { MotorFlcTableRow } from "@/features/motor-flc/types";
import type { LockedRotorTableRow } from "@/features/locked-rotor/types";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";

/**
 * Wraps calc-api's electrical reference endpoints
 * (calc-api/src/main/java/com/renzoproject/calc_api/electrical/reference/ConductorReferenceController.java).
 * Shared across every calculator that needs PEC conductor/conduit reference data (voltage
 * drop today; wire sizing and conduit fill later), not just voltage-drop — hence living in
 * lib/ rather than under features/voltage-drop/.
 */
export function getConductorSizes(): Promise<ConductorSizeOption[]> {
  return apiGet<ConductorSizeOption[]>("/api/electrical/reference/conductor-sizes");
}

export function getConductorMaterials(): Promise<ConductorMaterial[]> {
  return apiGet<ConductorMaterial[]>("/api/electrical/reference/conductor-materials");
}

export function getConduitMaterials(): Promise<ConduitMaterial[]> {
  return apiGet<ConduitMaterial[]>("/api/electrical/reference/conduit-materials");
}

export function getConductorImpedanceTable(): Promise<ConductorImpedanceTableRow[]> {
  return apiGet<ConductorImpedanceTableRow[]>(
    "/api/electrical/reference/conductor-impedance-table",
  );
}

export function getConductorDcResistanceTable(): Promise<ConductorDcResistanceTableRow[]> {
  return apiGet<ConductorDcResistanceTableRow[]>(
    "/api/electrical/reference/conductor-dc-resistance-table",
  );
}

/**
 * Conduit fill's insulation types (calc-core's InsulationType) — a distinct list from
 * voltage drop's ConductorMaterial.
 */
export function getInsulationTypes(): Promise<string[]> {
  return apiGet<string[]>("/api/electrical/reference/insulation-types");
}

/**
 * Conduit fill's conduit types (calc-core's ConduitType) — a distinct list from voltage
 * drop's ConduitMaterial, served under its own route for that reason.
 */
export function getConduitFillTypes(): Promise<string[]> {
  return apiGet<string[]>("/api/electrical/reference/conduit-fill-types");
}

/**
 * Conductor sizes with published dimension data for a given insulation type. Note: this is
 * a separate `conductor-fill-sizes` endpoint, not `conductor-sizes` with a query param —
 * `conductor-sizes` (used by voltage drop) returns {label, crossSectionMm2} objects sized
 * from a different table and has no insulationType filter.
 */
export function getConductorSizesForInsulationType(insulationType: string): Promise<string[]> {
  return apiGet<string[]>("/api/electrical/reference/conductor-fill-sizes", { insulationType });
}

export function getConductorDimensionTable(): Promise<ConductorDimensionTableRow[]> {
  return apiGet<ConductorDimensionTableRow[]>(
    "/api/electrical/reference/conductor-dimension-table",
  );
}

export function getConduitDimensionTable(): Promise<ConduitDimensionTableRow[]> {
  return apiGet<ConduitDimensionTableRow[]>("/api/electrical/reference/conduit-dimension-table");
}

/**
 * Wire sizing's termination temperature ratings — always exactly [60, 75, 90] (see
 * ConductorReferenceService.listTerminationTempRatings's Javadoc for why this is a fixed
 * constant, not a table lookup).
 */
export function getTerminationTempRatings(): Promise<number[]> {
  return apiGet<number[]>("/api/electrical/reference/termination-temp-ratings");
}

/** Motor supply types (calc-core's MotorPhaseType) — DC, SINGLE_PHASE, TWO_PHASE, THREE_PHASE. */
export function getMotorPhaseTypes(): Promise<string[]> {
  return apiGet<string[]>("/api/electrical/reference/motor-phase-types");
}

/** Three-phase motor construction classes (calc-core's MotorClass) — INDUCTION, SYNCHRONOUS. */
export function getMotorClasses(): Promise<string[]> {
  return apiGet<string[]>("/api/electrical/reference/motor-classes");
}

/**
 * Horsepower labels published for a phase type (+ motor class, required only when phaseType
 * is THREE_PHASE — the backend throws if it's missing in that case and ignores it otherwise).
 */
export function getMotorHorsepowerRatings(
  phaseType: string,
  motorClass?: string,
): Promise<string[]> {
  const params: Record<string, string> = { phaseType };
  if (motorClass) {
    params.motorClass = motorClass;
  }
  return apiGet<string[]>("/api/electrical/reference/motor-horsepower-ratings", params);
}

/** Voltages published for a phase type (+ motor class) + horsepower label combination. */
export function getMotorVoltages(
  phaseType: string,
  motorClass: string | undefined,
  horsepowerLabel: string,
): Promise<number[]> {
  const params: Record<string, string> = { phaseType, horsepowerLabel };
  if (motorClass) {
    params.motorClass = motorClass;
  }
  return apiGet<number[]>("/api/electrical/reference/motor-voltages", params);
}

/** Raw rows of the combined PEC Article 4.30 full-load current tables (4.30.14.1–4.30.14.4). */
export function getMotorFlcTable(): Promise<MotorFlcTableRow[]> {
  return apiGet<MotorFlcTableRow[]>("/api/electrical/reference/motor-flc-table");
}

/** Raw rows of PEC Table 4.30.14.5(A) (single-phase locked-rotor current). */
export function getLockedRotorSinglePhaseTable(): Promise<LockedRotorTableRow[]> {
  return apiGet<LockedRotorTableRow[]>(
    "/api/electrical/reference/locked-rotor-single-phase-table",
  );
}

/** Raw rows of PEC Table 4.30.14.5(B) (polyphase locked-rotor current). */
export function getLockedRotorPolyphaseTable(): Promise<LockedRotorTableRow[]> {
  return apiGet<LockedRotorTableRow[]>("/api/electrical/reference/locked-rotor-polyphase-table");
}

/**
 * Pipe material/schedule/nominal-size reference catalog for the pipe velocity/sizing
 * calculator's dropdowns (calc-api's PipeReferenceController).
 */
export function getPipeMaterials(): Promise<PipeMaterialOption[]> {
  return apiGet<PipeMaterialOption[]>("/api/mechanical/reference/pipe-materials");
}
