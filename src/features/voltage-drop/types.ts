/**
 * Mirrors calc-core's CircuitType enum
 * (calc-core/src/main/java/com/renzoproject/calc/core/electrical/voltagedrop/CircuitType.java).
 * This is the single source of truth for the allowed values — the zod schema and the
 * form's select options both derive from this array rather than redeclaring it.
 */
export const CIRCUIT_TYPES = ["DC", "SINGLE_PHASE_AC", "THREE_PHASE_AC"] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];

/**
 * Mirrors calc-core's ConductorMaterial enum
 * (calc-core/src/main/java/com/renzoproject/calc/core/electrical/reference/ConductorMaterial.java).
 */
export const CONDUCTOR_MATERIALS = ["COPPER", "ALUMINUM"] as const;

export type ConductorMaterial = (typeof CONDUCTOR_MATERIALS)[number];

/**
 * Mirrors calc-core's ConduitMaterial enum
 * (calc-core/src/main/java/com/renzoproject/calc/core/electrical/reference/ConduitMaterial.java).
 */
export const CONDUIT_MATERIALS = ["PVC", "ALUMINUM", "STEEL"] as const;

export type ConduitMaterial = (typeof CONDUIT_MATERIALS)[number];

/** Mirrors calc-api's ConductorSizeDto field-for-field. */
export interface ConductorSizeOption {
  label: string;
  crossSectionMm2: number;
}

/**
 * Mirrors calc-api's ConductorImpedanceEntryDto field-for-field — one row of PEC Table
 * 10.1.1.9 (AC resistance and reactance), as published (ohms per 305 meters). Resistance
 * fields are nullable since not every material/conduit combination has published data for
 * every size.
 */
export interface ConductorImpedanceTableRow {
  sizeLabel: string;
  reactancePvcAluminumConduitOhmsPer305m: number;
  reactanceSteelConduitOhmsPer305m: number;
  resistanceCopperPvcOhmsPer305m: number | null;
  resistanceCopperAluminumConduitOhmsPer305m: number | null;
  resistanceCopperSteelOhmsPer305m: number | null;
  resistanceAluminumWirePvcOhmsPer305m: number | null;
  resistanceAluminumWireAluminumConduitOhmsPer305m: number | null;
  resistanceAluminumWireSteelOhmsPer305m: number | null;
}

/**
 * Mirrors calc-api's ConductorDcResistanceEntryDto field-for-field — one row of PEC Table
 * 10.1.1.8 (DC resistance), as published (ohms per 305 meters). Some sizes publish both a
 * solid and a stranded row, distinguished by `stranded`.
 */
export interface ConductorDcResistanceTableRow {
  sizeLabel: string;
  stranded: boolean;
  strandCount: number;
  copperUncoatedOhmsPer305m: number;
  copperCoatedOhmsPer305m: number;
  aluminumOhmsPer305m: number;
}

/**
 * Mirrors calc-api's VoltageDropRequest field-for-field.
 *
 * useCustomImpedance is a mode switch (see VoltageDropRequest.isImpedanceSelectionValid):
 * when false, conductorSizeLabel/conductorMaterial/conduitMaterial resolve R/X from PEC
 * reference tables; when true, customResistanceOhmsPerMeter/customReactanceOhmsPerMeter
 * are used directly. Exactly one set is populated per request.
 */
export interface VoltageDropRequest {
  circuitType: CircuitType;
  currentAmps: number;
  oneWayLengthMeters: number;
  powerFactor: number;
  systemVoltage: number;
  parallelSetsPerPhase: number;
  useCustomImpedance: boolean;
  conductorSizeLabel: string | null;
  conductorMaterial: ConductorMaterial | null;
  conduitMaterial: ConduitMaterial | null;
  customResistanceOhmsPerMeter: number | null;
  customReactanceOhmsPerMeter: number | null;
}

/** Mirrors calc-api's VoltageDropResponse field-for-field. */
export interface VoltageDropResponse {
  voltageDropVolts: number;
  voltageDropPercent: number;
  receivingEndVoltage: number;
  exceedsRecommendedLimit: boolean;
}
