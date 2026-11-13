import type { ComplianceCheck } from "@/lib/checkStatus";

/** How a fire case's heat release rate is given: directly, or grown from a t-squared fire. */
export const FIRE_CASE_KINDS = ["STEADY", "GROWING"] as const;
export type FireCaseKind = (typeof FIRE_CASE_KINDS)[number];

export { CHECK_STATUSES, type CheckBasis, type CheckStatus, type ComplianceCheck } from "@/lib/checkStatus";

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
  eaveHeight?: number;
}

/** Mirrors calc-api's FireCaseDto: one design fire in one zone. Units: kW, s, m, m2, kW/m2. */
export interface FireCaseRequest {
  name: string;
  zoneName: string;
  kind: FireCaseKind;
  steadyHeatReleaseRate?: number;
  growthTime?: number;
  detectionTime?: number;
  detectorDistance?: number;
  detectorTemperatureRise?: number;
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

/**
 * Mirrors calc-api's ImageFireScenarioDto: the smoke layer of a fire against a wall (multiplier 2) or in a
 * corner (4) by the image-fire method. Supplementary, not NFPA 204. Units: kW, kg/s, K.
 */
export interface ImageFireScenario {
  multiplier: number;
  equivalentHeatReleaseRate: number;
  plumeMassFlow: number;
  layerTemperatureRise: number;
  layerTemperature: number;
}

/** Mirrors calc-api's ImageFireDto: the layer for a fire against a wall and in a corner. */
export interface ImageFire {
  wall: ImageFireScenario;
  corner: ImageFireScenario;
}

/**
 * Mirrors calc-api's TransientInterfaceDto: the supplementary time-stepping check of the smoke layer
 * boundary (not NFPA 204). Units: s, m. The two times are null when the boundary does not fall below the
 * design height within the horizon.
 */
export interface TransientInterface {
  endTime: number;
  interfaceHeightAtEnd: number;
  timeToDesignHeight: number | null;
  timeToDesignHeightWithoutVents: number | null;
  horizon: number;
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
  detectionTime: number | null;
  detectionTimeFromDetector: boolean;
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
  checks: ComplianceCheck[];
  imageFire: ImageFire;
  transientInterface: TransientInterface | null;
}

/** Mirrors calc-api's ZoneResultDto: the checks for a zone that do not depend on a fire. */
export interface ZoneResult {
  name: string;
  checks: ComplianceCheck[];
}

/** Mirrors calc-api's NaturalVentingResponse. */
export interface NaturalVentingResponse {
  fireCases: FireCaseResult[];
  zones: ZoneResult[];
}

/** Mirrors calc-api's DischargeCoefficientEntryDto: one default Cd for a vent or inlet type. */
export interface DischargeCoefficientEntry {
  key: string;
  label: string;
  dischargeCoefficient: number;
  clause: string;
  confidence: string;
}

/** Mirrors calc-api's CommodityHeatReleaseEntryDto: one row of Table A.8.2.6, kW per m2 of floor area. */
export interface CommodityHeatReleaseEntry {
  key: string;
  label: string;
  heatReleaseRateKwPerM2: number;
  confidence: string;
}

/** Mirrors calc-api's NaturalVentingReferenceResponse. */
export interface NaturalVentingReference {
  edition: string;
  note: string;
  dischargeCoefficients: DischargeCoefficientEntry[];
  commodities: CommodityHeatReleaseEntry[];
}