import type { DiameterSpecType } from "@/lib/diameterSpec";
import type { FrictionFactorMethod } from "@/lib/frictionFactorMethod";
import type { PipePressureLossResponse } from "@/features/pipe-pressure-loss/types";

/** Mirrors calc-api's SuctionConditionDto enum (mechanical.pump package's own copy). */
export const SUCTION_CONDITIONS = ["FLOODED", "LIFT"] as const;
export type SuctionCondition = (typeof SUCTION_CONDITIONS)[number];

/**
 * Mirrors calc-api's PipeSegmentSpecDto field-for-field — one row of a suction/discharge
 * PipeSegmentListInput. Uses the same DiameterSpec discriminated shape as
 * PipePressureLossRequest (diameterSpecType/nominalMaterial/nominalSchedule/nominalLabel/
 * rawDiameterValue/rawDiameterUnit); the nominalLabel-is-actually-nominalSize naming gotcha
 * applies here too — see NominalSize's Javadoc in calc-core.
 */
export interface PipeSegmentSpec {
  diameterSpecType: DiameterSpecType;
  nominalMaterial: string | null;
  nominalSchedule: string | null;
  nominalLabel: string | null;
  rawDiameterValue: number | null;
  rawDiameterUnit: string | null;
  lengthMeters: number;
  method: FrictionFactorMethod;
}

/** Mirrors calc-api's PumpTDHRequest field-for-field. */
export interface PumpTDHRequest {
  fluidKey: string;
  fluidTemperatureCelsius: number;
  flowRateValue: number;
  flowRateUnit: string;
  suctionCondition: SuctionCondition;
  staticSuctionLiftMeters: number | null;
  staticSuctionHeadFloodedMeters: number | null;
  suctionSegments: PipeSegmentSpec[];
  staticDischargeElevationMeters: number;
  requiredResidualPressureKpa: number;
  dischargeSegments: PipeSegmentSpec[];
  includeVelocityHead: boolean;
}

/**
 * Mirrors calc-api's SegmentLossDetailDto field-for-field. `result` embeds the exact same
 * PipePressureLossResponse shape the pressure-loss calculator returns — reused directly here
 * rather than redeclared, since PressureLossResults (built for that page) renders it as-is for
 * each segment's expandable detail.
 */
export interface SegmentLossDetail {
  segment: PipeSegmentSpec;
  result: PipePressureLossResponse;
}

/** Mirrors calc-api's PumpTDHResponse field-for-field. */
export interface PumpTDHResponse {
  staticHeadMeters: number;
  totalSuctionHeadLossMeters: number;
  totalDischargeHeadLossMeters: number;
  residualPressureHeadMeters: number;
  velocityHeadMeters: number;
  totalDynamicHeadMeters: number;
  staticallyFedWarning: boolean;
  suctionSegmentDetails: SegmentLossDetail[];
  dischargeSegmentDetails: SegmentLossDetail[];
}
