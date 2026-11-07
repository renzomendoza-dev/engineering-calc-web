"use client";

import { useLiveApiResult, type LiveApiResultState } from "@/hooks/useLiveApiResult";
import { toStandpipeRequest } from "./request";
import { standpipeHydraulicSchema, type StandpipeFormInput } from "./schema";
import type { StandpipeHydraulicResponse } from "./types";

export const STANDPIPE_HYDRAULICS_PATH = "/api/mechanical/standpipe/hydraulics";

/** The live calculation's state: see useLiveApiResult for what each field means. */
export type StandpipeCalculationState = LiveApiResultState<StandpipeHydraulicResponse>;

/**
 * The request body for the current form state as a JSON string, or null when the input does not
 * pass the schema yet. A string so identical input compares equal and does not restart the
 * debounce.
 */
export function buildPayload(values: StandpipeFormInput): string | null {
  const parsed = standpipeHydraulicSchema.safeParse(values);
  if (!parsed.success) return null;
  return JSON.stringify(toStandpipeRequest(parsed.data));
}

/**
 * Runs the standpipe calculation on the API as the user edits. Every number shown comes from the
 * response; nothing here computes a flow, friction loss or pressure.
 */
export function useStandpipeCalculation(values: StandpipeFormInput): StandpipeCalculationState {
  return useLiveApiResult<StandpipeHydraulicResponse>(
    STANDPIPE_HYDRAULICS_PATH,
    buildPayload(values),
  );
}
