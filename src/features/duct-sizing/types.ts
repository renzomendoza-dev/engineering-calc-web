/** Mirrors calc-api's DuctSizingMethodDto enum. */
export const DUCT_SIZING_METHODS = ["EQUAL_FRICTION", "VELOCITY"] as const;
export type DuctSizingMethod = (typeof DUCT_SIZING_METHODS)[number];

/** Mirrors calc-api's DuctShapeDto enum. */
export const DUCT_SHAPES = ["ROUND", "RECTANGULAR"] as const;
export type DuctShape = (typeof DUCT_SHAPES)[number];

/** Mirrors calc-api's FixedDimensionTypeDto enum. */
export const FIXED_DIMENSION_TYPES = ["WIDTH", "HEIGHT"] as const;
export type FixedDimensionType = (typeof FIXED_DIMENSION_TYPES)[number];

/**
 * Mirrors calc-api's DuctSizingRequest field-for-field. Deliberately mixed HVAC-industry
 * units, not pure SI, matching that DTO's own convention: millimeters for duct dimensions,
 * L/s for airflow, m/s for velocity, Pa/m for friction rate, Celsius/meters for
 * temperature/altitude.
 *
 * One flat shape with TWO independent toggle-driven conditional-required-field groups
 * (shape, method) — only the fields relevant to the selected shape/method combination are
 * populated; the rest are null.
 */
export interface DuctSizingRequest {
  method: DuctSizingMethod;
  airFlowLps: number;
  airTemperatureCelsius: number;
  altitudeMeters: number;
  ductMaterial: string;
  frictionMethod: string;

  // --- shape ---
  shape: DuctShape;
  fixedDimensionType: FixedDimensionType | null;
  fixedDimensionValueMm: number | null;

  // --- method ---
  targetFrictionRatePaPerM: number | null;
  maxVelocityMps: number | null;
}

/**
 * Mirrors calc-api's DuctSizingResponse field-for-field. ductWidthMm/ductHeightMm are null
 * for ROUND shape.
 */
export interface DuctSizingResponse {
  equivalentDiameterMm: number;
  ductWidthMm: number | null;
  ductHeightMm: number | null;
  actualVelocityMps: number;
  reynoldsNumber: number;
  frictionFactor: number;
  actualFrictionRatePaPerM: number;
}

/**
 * Mirrors calc-api's DuctRoughnessEntryDto field-for-field — one row of
 * reference/duct/duct-roughness.json. sourceNote carries per-entry provenance/caveat text —
 * FIBERGLASS_DUCT_RIGID and CONCRETE_DUCT specifically call out extra caution even though the
 * file's overall confidence is "verified".
 */
export interface DuctRoughnessTableRow {
  material: string;
  label: string;
  absoluteRoughnessMm: number;
  sourceNote: string;
}

/**
 * The two duct-roughness materials whose sourceNote carries an extra caveat beyond the
 * file's overall "verified" confidence (see duct-roughness.json directly — FIBERGLASS_DUCT_RIGID
 * is ASHRAE's own "tentatively medium rough, no numeric data available" footnote;
 * CONCRETE_DUCT's source range is unusually wide, 10x from low to high).
 */
export const DUCT_MATERIALS_WITH_EXTRA_CAVEAT = ["FIBERGLASS_DUCT_RIGID", "CONCRETE_DUCT"] as const;

/** Mirrors calc-api's DuctVelocityLimitEntryDto field-for-field — one row of ASHRAE Table 12. */
export interface DuctVelocityLimitTableRow {
  ductLocation: string;
  label: string;
  ncRcRating: number;
  maxVelocityRectangularMps: number | null;
  maxVelocityRoundMps: number | null;
}
