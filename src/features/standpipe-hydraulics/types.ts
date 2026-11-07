export const STANDPIPE_CLASSES = ["CLASS_I", "CLASS_II", "CLASS_III"] as const;
export type StandpipeClass = (typeof STANDPIPE_CLASSES)[number];

export const SPRINKLER_PROTECTIONS = ["NONE", "FULL", "PARTIAL"] as const;
export type SprinklerProtection = (typeof SPRINKLER_PROTECTIONS)[number];

export const COMBINED_HAZARDS = ["LIGHT", "ORDINARY"] as const;
export type CombinedHazard = (typeof COMBINED_HAZARDS)[number];

export const PIPE_ROLES = ["HOSE_PIPING", "STANDPIPE", "BRANCH_LINE", "OTHER"] as const;
export type PipeRole = (typeof PIPE_ROLES)[number];

export const HOSE_CONNECTION_SIZES = ["ONE_AND_HALF_INCH", "TWO_AND_HALF_INCH"] as const;
export type HoseConnectionSize = (typeof HOSE_CONNECTION_SIZES)[number];

export const INLET_SIZES = ["TWO_AND_HALF_INCH", "FOUR_INCH", "FIVE_INCH"] as const;
export type InletSize = (typeof INLET_SIZES)[number];

export type CheckStatus = "PASS" | "FAIL" | "CONFIRM" | "OPEN" | "INFO";

/** Mirrors calc-api's StandpipeFittingDto: fittings of one type on a segment. */
export interface StandpipeFittingRequest {
  fittingType?: string;
  quantity: number;
  explicitEquivalentLengthFt?: number;
}

/**
 * Mirrors calc-api's StandpipeSegmentDto: one run of pipe on the path from the most remote hose
 * connection to the supply. Units: gpm, ft.
 */
export interface StandpipeSegmentRequest {
  label: string;
  role: PipeRole;
  flowAddedGpm?: number;
  hoseConnectionSize?: HoseConnectionSize;
  otherStandpipeConnection?: boolean;
  designResidualPressurePsi?: number;
  pipeMaterial: string;
  schedule?: string;
  nominalSize: string;
  cFactor: number;
  pipeLengthFt: number;
  elevationRiseFt: number;
  fittings?: StandpipeFittingRequest[];
}

/**
 * Mirrors calc-api's StandpipeFdcLineDto: the piping of one fire department connection, from the
 * system to the connection. Units: gpm, ft.
 */
export interface StandpipeFdcLineRequest {
  label: string;
  flowGpm?: number;
  inlets?: number;
  segments: StandpipeSegmentRequest[];
}

/** Mirrors calc-api's StandpipeHydraulicRequest. */
export interface StandpipeHydraulicRequest {
  standpipeClass: StandpipeClass;
  sprinklerProtection?: SprinklerProtection;
  sprinklerHazard?: CombinedHazard;
  sprinklerDemandGpm?: number;
  additionalStandpipes: number;
  floorAreaOver80000SqFt: boolean;
  horizontalStandpipeOnThreeConnections: boolean;
  singleConnectionLaterals?: number;
  risersEndAtDifferentLevels?: boolean;
  manualSystem?: boolean;
  fireDepartmentConnectionInletSize?: InletSize;
  fireDepartmentConnectionInlets?: number;
  supplyDurationMinutes?: number;
  flowAddedAtSupplyGpm?: number;
  supplyStaticPressurePsi?: number;
  lowestHoseConnectionHeightFt?: number;
  fireDepartmentConnections?: StandpipeFdcLineRequest[];
  segments: StandpipeSegmentRequest[];
}

/** Mirrors calc-api's StandpipeCheckDto: one line of the compliance table. */
export interface StandpipeCheck {
  clause: string;
  description: string;
  status: CheckStatus;
  actual: number | null;
  limit: number | null;
  unit: string | null;
  note: string | null;
}

/** Mirrors calc-api's DemandLineDto: one step of the demand build-up, in gpm. */
export interface DemandLine {
  clause: string;
  description: string;
  flowGpm: number;
}

/**
 * Mirrors calc-api's StandpipeSegmentRowDto: one worksheet row. Units: psi, gpm, ft, in., ft/s.
 * Every figure comes from the API; nothing in the page recomputes one.
 */
export interface StandpipeSegmentRow {
  label: string;
  role: PipeRole;
  hoseConnectionSize: HoseConnectionSize | null;
  nominalSize: string;
  insideDiameterInch: number;
  cFactor: number;
  flowAddedGpm: number;
  flowGpm: number;
  velocityFtPerSec: number;
  pipeLengthFt: number;
  fittingsLengthFt: number;
  frictionPsiPerFt: number;
  frictionLossPsi: number;
  elevationRiseFt: number;
  elevationPsi: number;
  pressureAtRemoteEndPsi: number;
  pressureAtSupplyEndPsi: number;
  residualRaised: boolean;
  otherStandpipeConnection: boolean;
}

/**
 * Mirrors calc-api's FdcLineRowDto: the pressure required at one fire department connection. In
 * each row of `segments` the "remote end" is the system side and the "supply end" the connection
 * side. Units: psi, gpm.
 */
export interface FdcLineRow {
  label: string;
  flowGpm: number;
  inlets: number | null;
  segments: StandpipeSegmentRow[];
  totalFrictionLossPsi: number;
  totalElevationPsi: number;
  pressureAtSystemPsi: number;
  pressureAtFdcPsi: number;
}

/** Mirrors calc-api's StandpipeHydraulicResponse. */
export interface StandpipeHydraulicResponse {
  demandLines: DemandLine[];
  requiredFlowGpm: number;
  requiredFlowCapped: boolean;
  mostRemoteStandpipeFlowGpm: number;
  flowAtSupplyGpm: number;
  flowAddedAtSupplyGpm: number;
  flowAddedAtSupplyAutomatic: boolean;
  pressureAtSupplyPsi: number;
  totalFrictionLossPsi: number;
  totalElevationPsi: number;
  requiredFdcInlets: number;
  fdcInletSize: InletSize;
  manualSystem: boolean;
  supplyDurationMinutes: number;
  waterSupplyVolumeGal: number;
  fdcLines: FdcLineRow[];
  highestFdcPressurePsi: number | null;
  staticPressureAtLowestConnectionPsi: number | null;
  segments: StandpipeSegmentRow[];
  checks: StandpipeCheck[];
}

/** Mirrors calc-api's StandpipeFittingEntryDto: one fitting of the equivalent length chart. */
export interface StandpipeFittingEntry {
  fittingType: string;
  label: string;
  confidence: string;
  equivalentLengthFtByNominalSize: Record<string, number>;
}

/** Mirrors calc-api's StandpipeCFactorEntryDto: one row of the Hazen-Williams C table. */
export interface StandpipeCFactorEntry {
  pipeType: string;
  label: string;
  cFactor: number;
  confidence: string;
}

/**
 * Mirrors calc-api's StandpipeHoseNozzleEntryDto: one row of Table A.10.2.6, a hose and nozzle
 * combination with the pressure needed at the hose valve outlet to flow it.
 */
export interface StandpipeHoseNozzleEntry {
  number: number;
  label: string;
  hose: string;
  nozzle: string | null;
  outletPressurePsi: number;
  flowGpm: number;
  aboveMinimumResidual: boolean;
  confidence: string;
  sourceNote: string | null;
}

/** Mirrors calc-api's StandpipeReferenceResponse. */
export interface StandpipeReference {
  edition: string;
  note: string;
  fittings: StandpipeFittingEntry[];
  cFactors: StandpipeCFactorEntry[];
  hoseNozzleNote: string;
  hoseNozzleCombinations: StandpipeHoseNozzleEntry[];
}
