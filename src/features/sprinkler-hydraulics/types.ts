/**
 * Mirrors calc-api's sprinkler hydraulic DTOs field-for-field.
 *
 * Units are NFPA 13's throughout — psi, US gpm, feet, inches, ft² — not the SI the pipe and duct
 * endpoints use. Nothing here is recomputed in the browser: every displayed number comes from
 * SprinklerHydraulicResponse.
 */

/** Mirrors calc-api's SprinklerSystemTypeDto. */
export const SPRINKLER_SYSTEM_TYPES = ["WET", "DRY", "PREACTION"] as const;
export type SprinklerSystemType = (typeof SPRINKLER_SYSTEM_TYPES)[number];

/** Mirrors calc-api's SprinklerHazardDto. */
export const SPRINKLER_HAZARDS = [
  "LIGHT",
  "ORDINARY_GROUP_1",
  "ORDINARY_GROUP_2",
  "EXTRA_GROUP_1",
  "EXTRA_GROUP_2",
] as const;
export type SprinklerHazard = (typeof SPRINKLER_HAZARDS)[number];

/** Mirrors calc-api's SegmentFittingDto. */
export interface SegmentFittingRequest {
  fittingType: string | null;
  quantity: number;
  explicitEquivalentLengthFt: number | null;
}

/** Mirrors calc-api's SprinklerPipeSegmentDto. fromNodeId is upstream; toNodeId points at the supply. */
export interface SprinklerPipeSegmentRequest {
  fromNodeId: string;
  toNodeId: string;
  pipeMaterial: string;
  schedule: string | null;
  nominalSize: string;
  cFactor: number;
  pipeLengthFt: number;
  elevationChangeFt: number;
  fittings: SegmentFittingRequest[] | null;
}

/** Mirrors calc-api's RemoteAreaSprinklerDto. */
export interface RemoteAreaSprinklerRequest {
  nodeId: string;
  kFactor: number;
  coverageAreaSqFt: number;
}

/** Mirrors calc-api's WaterSupplySourceDto. A source with no pressure of its own is not a variant: that system sends no waterSupply at all. */
export const WATER_SUPPLY_SOURCES = ["FLOW_TEST", "GRAVITY_TANK"] as const;
export type WaterSupplySource = (typeof WATER_SUPPLY_SOURCES)[number];

/** Mirrors calc-api's FlowTestSupplyDto. There is no supply-elevation field: elevation enters only through each segment's elevationChangeFt. */
export interface FlowTestSupplyRequest {
  staticPressurePsi: number;
  residualPressurePsi: number;
  flowAtResidualGpm: number;
}

/**
 * Mirrors calc-api's SupplyPipeRunDto — one pipe run from a gravity tank to the connection.
 * No node ids (the supply side is one path, not a tree) and no elevation change: the tank's
 * height is stated once on the tank, and repeating it here would count the same head twice.
 */
export interface SupplyPipeRunRequest {
  pipeMaterial: string;
  schedule: string | null;
  nominalSize: string;
  cFactor: number;
  pipeLengthFt: number;
  fittings: SegmentFittingRequest[] | null;
}

/** Mirrors calc-api's GravityTankSupplyDto. With no outletRuns the full head is credited at every flow, which the API warns about. */
export interface GravityTankSupplyRequest {
  waterLevelHeightFt: number;
  outletRuns: SupplyPipeRunRequest[] | null;
}

/** Mirrors calc-api's WaterSupplyDto. `source` says which block is filled in; the other is null. */
export interface WaterSupplyRequest {
  source: WaterSupplySource;
  flowTest: FlowTestSupplyRequest | null;
  gravityTank: GravityTankSupplyRequest | null;
}

/** Mirrors calc-api's DeviceLossDto. */
export interface DeviceLossRequest {
  name: string;
  pressureLossPsi: number;
}

/** Mirrors calc-api's SprinklerHydraulicRequest field-for-field. */
export interface SprinklerHydraulicRequest {
  systemType: SprinklerSystemType;
  hazard: SprinklerHazard;
  densityGpmPerSqFt: number;
  designAreaSqFt: number;
  hoseStreamGpm: number;
  hoseStreamNodeId: string | null;
  /**
   * Optional, and can only raise the start: the most remote sprinkler always starts at least at
   * the pressure its design flow needs and the minimum operating pressure. The form no longer asks
   * for it, so it is sent as null and those govern.
   */
  assumedStartPressurePsi: number | null;
  sprinklers: RemoteAreaSprinklerRequest[];
  segments: SprinklerPipeSegmentRequest[];
  /** Null for a system with no pressurised source yet — the demand is still calculated. */
  waterSupply: WaterSupplyRequest | null;
  deviceLosses: DeviceLossRequest[] | null;
}

/** Mirrors calc-api's SegmentFlowRowDto — one row of the hydraulic calculation sheet. */
export interface SegmentFlowRow {
  fromNodeId: string;
  toNodeId: string;
  flowGpm: number;
  nominalSize: string;
  insideDiameterInch: number;
  cFactor: number;
  pipeLengthFt: number;
  /** Total for this segment's fittings, already rescaled by fittingCFactorAdjustment. */
  fittingEquivalentLengthFt: number;
  /**
   * The multiplier calc-core applied to lengths looked up from NFPA 13's chart, which is
   * published in feet of C = 120 pipe: (C / 120)^1.85. It is 1.0 when the segment is C = 120, and
   * also when every fitting on it carried an explicit length, since those are never rescaled.
   */
  fittingCFactorAdjustment: number;
  totalLengthFt: number;
  frictionLossPsiPerFoot: number;
  frictionLossPsi: number;
  elevationPressurePsi: number;
  endPressurePsi: number;
  velocityFps: number;
}

/** Mirrors calc-api's SupplyCurvePointDto. */
export interface SupplyCurvePoint {
  flowGpm: number;
  availablePressurePsi: number;
}

/**
 * Mirrors calc-api's SprinklerHydraulicResponse field-for-field.
 *
 * The four supply-dependent figures are null when the request carried no water supply — `passes`
 * especially: null is "nobody asked", not "it failed", and the UI must not collapse the two.
 */
export interface SprinklerHydraulicResponse {
  segments: SegmentFlowRow[];
  totalDemandFlowGpm: number;
  requiredPressureAtSupplyPsi: number;
  availablePressureAtDemandPsi: number | null;
  safetyMarginPsi: number | null;
  safetyMarginPercent: number | null;
  passes: boolean | null;
  /** Empty when there is no supply to plot. */
  supplyCurve: SupplyCurvePoint[];
  warnings: string[];
}

/**
 * Mirrors calc-api's HazardPresetEntryDto. durationMinutes and maxCoverageSqFtPerSprinkler are
 * published but are NOT request fields — they are shown as information only.
 */
export interface HazardPresetTableRow {
  hazard: string;
  label: string;
  densityGpmPerSqFt: number;
  designAreaSqFt: number;
  hoseStreamGpm: number;
  durationMinutes: number;
  maxCoverageSqFtPerSprinkler: number;
  confidence: string;
  sourceNote: string | null;
}

/**
 * Mirrors calc-api's SprinklerKFactorEntryDto. `threadType` is the published thread size, not an
 * orifice size — an earlier version of this type called it `orificeNominal`, which the backend
 * corrected. The range fields bound the actual K a listed sprinkler may carry under this nominal
 * value; they are null where the standard doesn't publish them.
 */
export interface SprinklerKFactorTableRow {
  nominalK: number;
  nominalKLpmBar: number | null;
  kFactorRangeMinGpm: number | null;
  kFactorRangeMaxGpm: number | null;
  percentOfK56Discharge: number | null;
  threadType: string | null;
  label: string;
  confidence: string;
}

/**
 * Mirrors calc-api's SprinklerCFactorEntryDto. systemType is "ANY" where C doesn't vary with
 * service. The epsilon figures are the absolute roughness NFPA 13's annex pairs with each C value,
 * passed through for display only — Hazen-Williams takes C, not roughness — and are null where the
 * annex gives none.
 */
export interface SprinklerCFactorTableRow {
  pipeType: string;
  systemType: string;
  cFactor: number;
  epsilonFactorInch: number | null;
  epsilonFactorMm: number | null;
  label: string;
  confidence: string;
  sourceNote: string | null;
}

/** Mirrors calc-api's FittingEquivalentLengthEntryDto. An empty map means "not published yet". */
export interface FittingEquivalentLengthTableRow {
  fittingType: string;
  label: string;
  confidence: string;
  equivalentLengthFtByNominalSize: Record<string, number>;
}

/**
 * Mirrors calc-api's RemoteAreaPlanRequest. Not part of the hydraulic request: the plan tells the
 * designer how many sprinklers to list, and the hydraulic calculation takes whatever is listed.
 *
 * Built to be sent in stages as the form fills in. The first four figures give the area, the flow
 * per sprinkler and the first sprinkler's pressure; `sprinklerSpacingFt` is only needed for the
 * layout, and null leaves the layout fields null in the response. `ceilingHeightFt` is required
 * when `quickResponseSprinklers` is true.
 */
export interface RemoteAreaPlanRequest {
  designAreaSqFt: number;
  densityGpmPerSqFt: number;
  kFactor: number;
  coveragePerSprinklerSqFt: number;
  sprinklerSpacingFt: number | null;
  quickResponseSprinklers: boolean;
  ceilingHeightFt: number | null;
  maxCoveragePerSprinklerSqFt: number | null;
}

/**
 * Mirrors calc-api's RemoteAreaPlanResponse field-for-field, in the order the work is done by
 * hand. Every figure is the API's; the counts are rounded up there, so the plan is never smaller
 * than the design area.
 *
 * Three tiers, available as the request's inputs are: the area and per-sprinkler figures always;
 * the shape of the remote area from the area alone; and the layout fields from
 * `branchSpacingFt` to `totalProtectedAreaSqFt` only once the spacing was sent — null before then.
 */
export interface RemoteAreaPlanResponse {
  baseDesignAreaSqFt: number;
  reductionPercent: number;
  reductionApplied: boolean;
  adjustedDesignAreaSqFt: number;
  coveragePerSprinklerSqFt: number;
  sprinklersForArea: number;
  flowPerSprinklerGpm: number;
  pressureForFlowPsi: number;
  minimumOperatingPressurePsi: number;
  firstSprinklerPressurePsi: number;
  firstSprinklerFlowGpm: number;
  floorGoverned: boolean;
  remoteAreaLengthFt: number;
  remoteAreaWidthFt: number;
  branchSpacingFt: number | null;
  sprinklersPerBranch: number | null;
  branchLines: number | null;
  totalSprinklers: number | null;
  totalProtectedAreaSqFt: number | null;
  rulesConfidence: string;
  notes: string[];
  warnings: string[];
}
