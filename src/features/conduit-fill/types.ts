/** Mirrors calc-api's ConductorFillEntryDto field-for-field. */
export interface ConductorFillEntry {
  insulationType: string;
  sizeLabel: string;
  quantity: number;
}

/** Mirrors calc-api's ConduitFillRequest field-for-field. */
export interface ConduitFillRequest {
  conductors: ConductorFillEntry[];
  conduitType: string;
}

/**
 * Mirrors calc-api's PracticalFillAdvisoryDto field-for-field. A field-experience pull-ease
 * heuristic — explicitly NOT a PEC code compliance result — so it must stay visually and
 * semantically distinct from the legal fill-compliance fields on ConduitFillResponse.
 */
export interface PracticalFillAdvisory {
  mayBeDifficultToPull: boolean;
  note: string | null;
}

/** Mirrors calc-api's ConduitFillResponse field-for-field. */
export interface ConduitFillResponse {
  recommendedTradeSizeMm: string | null;
  totalConductorAreaMm2: number;
  totalConductorCount: number;
  allowedFillPercent: number;
  actualFillPercentAtRecommendedSize: number | null;
  requiresMultipleConduits: boolean;
  practicalFillAdvisory: PracticalFillAdvisory | null;
}

/**
 * Mirrors calc-api's ConductorDimensionEntryDto field-for-field — one row of PEC Table
 * 10.1.1.5 (dimensions of insulated conductors and fixture wires), as published.
 */
export interface ConductorDimensionTableRow {
  insulationType: string;
  withoutOuterCovering: boolean;
  sizeLabel: string;
  approximateAreaMm2: number;
  approximateDiameterMm: number;
}

/**
 * Mirrors calc-api's ConduitDimensionEntryDto field-for-field — one row of PEC Table
 * 10.1.1.4 (dimensions and percent area of conduit and tubing), as published.
 */
export interface ConduitDimensionTableRow {
  conduitType: string;
  racewaySizeMm: number;
  over2Wires40PercentMm2: number;
  sixtyPercentMm2: number;
  oneWire53PercentMm2: number;
  twoWires53PercentMm2: number;
  nominalInternalDiameterMm: number;
  totalArea100PercentMm2: number;
}
