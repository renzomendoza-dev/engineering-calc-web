"use client";

import { getDuctVelocityLimitsTable } from "@/lib/reference-api";
import type { DuctVelocityLimitTableRow } from "@/features/duct-sizing/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseDuctVelocityLimitsResult {
  rows: DuctVelocityLimitTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches ASHRAE Table 12 (recommended max airflow velocity by duct location + NC/RC
 * acoustic rating), backing DuctVelocitySuggestionHelper's "suggest a value" lookup for the
 * VELOCITY sizing method — display/suggestion only, never consumed by the sizing calculation
 * itself (same design as DuctSizingCalculator not calling this resolver internally).
 */
export function useDuctVelocityLimits(): UseDuctVelocityLimitsResult {
  const { data, isLoading, error } = useReferenceData(
    "duct-velocity-limits",
    getDuctVelocityLimitsTable,
    "Failed to load reference data.",
  );
  return { rows: data ?? EMPTY_LIST, isLoading, error };
}
