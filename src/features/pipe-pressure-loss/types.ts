import type { DiameterSpecType } from "@/lib/diameterSpec";

/** Mirrors calc-api's FlowRegimeDto enum. */
export const FLOW_REGIMES = ["LAMINAR", "TRANSITIONAL", "TURBULENT"] as const;
export type FlowRegime = (typeof FLOW_REGIMES)[number];

/** Mirrors calc-api's FrictionFactorMethodDto enum. */
export const FRICTION_FACTOR_METHODS = ["SWAMEE_JAIN", "COLEBROOK_WHITE"] as const;
export type FrictionFactorMethod = (typeof FRICTION_FACTOR_METHODS)[number];

/**
 * Static fluid list — no reference/mechanical/fluids GET endpoint exists yet (calc-core's
 * reference/fluids/ only publishes water.json so far), so this just mirrors calc-api's
 * fluidKey convention directly. Adding a fluid later is one more entry here, not a form
 * redesign.
 */
export const FLUIDS = [{ key: "WATER", label: "Water" }] as const;

/**
 * Mirrors calc-api's PipePressureLossRequest field-for-field. Uses the same DiameterSpec
 * discriminated shape as PipeVelocityRequest (diameterSpecType/nominalMaterial/
 * nominalSchedule/nominalLabel/rawDiameterValue/rawDiameterUnit) — see that record's Javadoc
 * for the nominalLabel-is-actually-nominalSize naming gotcha, which applies here too.
 */
export interface PipePressureLossRequest {
  fluidKey: string;
  fluidTemperatureCelsius: number;
  flowRateValue: number;
  flowRateUnit: string;
  diameterSpecType: DiameterSpecType;
  nominalMaterial: string | null;
  nominalSchedule: string | null;
  nominalLabel: string | null;
  rawDiameterValue: number | null;
  rawDiameterUnit: string | null;
  pipeLengthMeters: number;
  method: FrictionFactorMethod;
}

/** Mirrors calc-api's PipePressureLossResponse field-for-field. */
export interface PipePressureLossResponse {
  velocityMetersPerSecond: number;
  reynoldsNumber: number;
  flowRegime: FlowRegime;
  transitionalRegimeWarning: boolean;
  frictionFactor: number;
  headLossMeters: number;
  pressureLossPascals: number;
}
