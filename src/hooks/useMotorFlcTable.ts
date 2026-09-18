"use client";

import { getMotorFlcTable } from "@/lib/reference-api";
import type { MotorFlcTableRow } from "@/features/motor-flc/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseMotorFlcTableResult {
  rows: MotorFlcTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the full combined motor FLC reference table (all four PEC Article 4.30 tables
 * merged, same as calc-core's MotorFlcTable itself merges them), for display purposes only —
 * separate from useMotorReferenceData, which fetches the small mount-once dropdown lists the
 * form needs on every render. Mirrors useConductorReferenceTables' role for voltage drop.
 */
export function useMotorFlcTable(): UseMotorFlcTableResult {
  const { data, isLoading, error } = useReferenceData(
    "motor-flc-table",
    getMotorFlcTable,
    "Failed to load reference table.",
  );
  return { rows: data ?? EMPTY_LIST, isLoading, error };
}
