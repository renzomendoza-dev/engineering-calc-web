/** How a fire case's heat release rate is given: directly, or grown from a t-squared fire. */
export const FIRE_CASE_KINDS = ["STEADY", "GROWING"] as const;
export type FireCaseKind = (typeof FIRE_CASE_KINDS)[number];

export const CHECK_STATUSES = ["PASS", "FAIL", "CONFIRM", "OPEN", "INFO"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

/** Whether a check is a requirement of NFPA 204 or something supplementary to it. */
export const CHECK_BASES = ["NFPA_204", "SUPPLEMENTARY"] as const;
export type CheckBasis = (typeof CHECK_BASES)[number];

export type PlumeRegime = "BELOW_LAYER" | "REACHES_LAYER";

/**
 * Mirrors calc-api's VentZoneDto: one curtained area, with the vents and inlets provided.
 * Units: m, m2, K, kW/m2. Anything optional that is left out is reported as OPEN by the
 * checks that need it.
 */
export interface VentZoneRequest {
  name: string;
  ceilingHeight: number;
  ventCentreHeight?: number;
  curtainDepth?: number;
  zoneLength?: number;
  zoneWidth?: number;
  ventDischargeCoefficient: number;
  ventCount?: number;
  ventTotalArea?: number;
  ventUnitLength?: number;
  ventUnitWidth?: number;
  ventSpacing?: number;
  ventToWallDistance?: number;
  inletDischargeCoefficient?: number;
  inletAreaRatio?: number;
  inletNetArea?: number;
  maxLayerTemperatureRise?: number;
  maxFloorRadiantFlux?: number;
  aisleWidth?: number;
}

/** Mirrors calc-api's FireCaseDto: one design fire in one zone. Units: kW, s, m, m2, kW/m2. */
export interface FireCaseRequest {
  name: string;
  zoneName: string;
  kind: FireCaseKind;
  steadyHeatReleaseRate?: number;
  growthTime?: number;
  detectionTime?: number;
  designInterval?: number;
  maxHeatReleaseRate?: number;
  fireDiameter?: number;
  fireArea?: number;
  unitHeatReleaseRate?: number;
  largestFireDimension?: number;
  fireBaseHeight?: number;
  smokeLayerHeight: number;
}

/** Mirrors calc-api's NaturalVentingRequest. Ambient temperature in degC. */
export interface NaturalVentingRequest {
  ambientTemperature: number;
  ambientDensity?: number;
  specificHeat?: number;
  layerEnergyFraction?: number;
  growthConstant?: number;
  zones: VentZoneRequest[];
  fireCases: FireCaseRequest[];
}

/** Mirrors calc-api's VentingCheckDto: one line of the compliance table. */
export interface VentingCheck {
  clause: string;
  description: string;
  basis: CheckBasis;
  status: CheckStatus;
  actual: number | null;
  limit: number | null;
  unit: string | null;
  note: string | null;
}

/**
 * Mirrors calc-api's FireCaseResultDto. Units: m, m2, kW, kW/m2, K, kg/s, kg/m3, m/s.
 * Every figure comes from the API; nothing in the page recomputes one.
 */
export interface FireCaseResult {
  name: string;
  zoneName: string;
  designHeatReleaseRate: number;
  heatReleaseRateCapped: boolean;
  growthCoefficient: number | null;
  fireDiameter: number;
  meanFlameHeight: number;
  virtualOrigin: number;
  layerHeightAboveFire: number;
  layerDepth: number;
  regime: PlumeRegime;
  lineFireFactor: number;
  convectiveHeatReleaseRate: number;
  plumeMassFlow: number;
  layerTemperatureRise: number;
  layerTemperature: number;
  layerDensity: number;
  aerodynamicVentArea: number;
  requiredVentArea: number | null;
  inletCorrection: number | null;
  requiredInletArea: number | null;
  inletAreaForVelocityLimit: number;
  inletVelocity: number | null;
  floorRadiantFlux: number;
  feasibleHeatReleaseRate: number;
  minimumAisleWidth: number | null;
  checks: VentingCheck[];
}

/** Mirrors calc-api's ZoneResultDto: the checks for a zone that do not depend on a fire. */
export interface ZoneResult {
  name: string;
  checks: VentingCheck[];
}

/** Mirrors calc-api's NaturalVentingResponse. */
export interface NaturalVentingResponse {
  fireCases: FireCaseResult[];
  zones: ZoneResult[];
}
