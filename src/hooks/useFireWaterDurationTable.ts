"use client";

import { getFireWaterDurationTable } from "@/lib/reference-api";
import type { FireWaterDurationTableRow } from "@/features/fire-water-storage/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseFireWaterDurationTableResult {
  rows: FireWaterDurationTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the full fire-water-duration reference table, for display purposes only — separate
 * from HAZARD_DURATION_RANGES, the client-side constant the form itself reads synchronously
 * for its instant "requires X-Y minutes" helper text (no network round trip acceptable
 * there). This hook backs the reference table shown alongside results instead. Mirrors
 * useMotorFlcTable's single-table role.
 */
export function useFireWaterDurationTable(): UseFireWaterDurationTableResult {
  const { data, isLoading, error } = useReferenceData(
    "fire-water-duration-table",
    getFireWaterDurationTable,
    "Failed to load reference table.",
  );
  return { rows: data ?? EMPTY_LIST, isLoading, error };
}
