/**
 * Mirrors calc-api's FrictionFactorMethodDto enum. Shared across pipe pressure loss (single
 * segment) and pump TDH (per-segment, inside PipeSegmentListInput rows).
 */
export const FRICTION_FACTOR_METHODS = ["SWAMEE_JAIN", "COLEBROOK_WHITE"] as const;
export type FrictionFactorMethod = (typeof FRICTION_FACTOR_METHODS)[number];
