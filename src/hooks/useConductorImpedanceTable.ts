"use client";

import { getConductorImpedanceTable } from "@/lib/reference-api";
import type { ConductorImpedanceTableRow } from "@/features/voltage-drop/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseConductorImpedanceTableResult {
  impedanceRows: ConductorImpedanceTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches PEC Table 10.1.1.9 (AC resistance and reactance) on its own.
 *
 * useConductorReferenceTables fetches this table together with the DC resistance table for the
 * reference display; the voltage drop form needs only this one, to tell which sizes an AC
 * calculation can resolve (see acImpedance.ts), so it doesn't pull the other.
 */
export function useConductorImpedanceTable(): UseConductorImpedanceTableResult {
  const { data, isLoading, error } = useReferenceData(
    "conductor-impedance-table",
    getConductorImpedanceTable,
    "Failed to load the impedance table.",
  );
  return { impedanceRows: data ?? EMPTY_LIST, isLoading, error };
}
