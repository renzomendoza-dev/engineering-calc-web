/**
 * Mirrors calc-api's FrictionFactorMethodDto enum. Shared across pipe pressure loss (single
 * segment) and pump TDH (per-segment, inside PipeSegmentListInput rows).
 */
export const FRICTION_FACTOR_METHODS = ["SWAMEE_JAIN", "COLEBROOK_WHITE"] as const;
export type FrictionFactorMethod = (typeof FRICTION_FACTOR_METHODS)[number];

/** Radio options for choosing the method, in the same order as FRICTION_FACTOR_METHODS. */
export const FRICTION_FACTOR_METHOD_OPTIONS: readonly { value: FrictionFactorMethod; label: string }[] = [
  { value: "SWAMEE_JAIN", label: "Swamee-Jain (fast)" },
  { value: "COLEBROOK_WHITE", label: "Colebrook-White (more precise)" },
];

/** Shown under the method choice wherever it appears (pipe pressure loss, duct sizing). */
export const FRICTION_FACTOR_METHOD_HINT =
  "Colebrook-White solves the implicit friction-factor equation by iterating to a converged answer — " +
  "more exact, but takes marginally longer. Swamee-Jain is a direct (non-iterative) approximation of " +
  "Colebrook-White, accurate to within about 1% for typical turbulent flow.";
