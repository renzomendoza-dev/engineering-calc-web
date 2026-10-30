"use client";

import { useLiveApiResult, type LiveApiResultState } from "@/hooks/useLiveApiResult";
import { toNaturalVentingRequest } from "./request";
import { naturalVentingSchema, type NaturalVentingFormInput } from "./schema";
import type { NaturalVentingResponse } from "./types";

export const NATURAL_VENTING_PATH = "/api/smoke-control/natural-venting";

/** The live calculation's state: see useLiveApiResult for what each field means. */
export type NaturalVentingCalculationState = LiveApiResultState<NaturalVentingResponse>;

/**
 * The request body for the current form state as a JSON string, or null when the input does not
 * pass the schema yet. A string so identical input compares equal and does not restart the
 * debounce.
 */
export function buildPayload(values: NaturalVentingFormInput): string | null {
  const parsed = naturalVentingSchema.safeParse(values);
  if (!parsed.success) return null;
  return JSON.stringify(toNaturalVentingRequest(parsed.data));
}

/**
 * Runs the NFPA 204 calculation on the API as the user edits. Every number shown comes from the
 * response; nothing here computes a flow, temperature or area.
 */
export function useNaturalVentingCalculation(
  values: NaturalVentingFormInput,
): NaturalVentingCalculationState {
  return useLiveApiResult<NaturalVentingResponse>(NATURAL_VENTING_PATH, buildPayload(values));
}
