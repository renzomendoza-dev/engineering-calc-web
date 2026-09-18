"use client";

import {
  getAmbientTempCorrectionTable,
  getAmpacityTable,
  getConductorCountAdjustmentTable,
  getInsulationTypeTempRatingTable,
} from "@/lib/reference-api";
import type {
  AmbientTempCorrectionTableRow,
  AmpacityTableRow,
  ConductorCountAdjustmentTableRow,
  InsulationTypeTempRatingTableRow,
} from "@/features/wire-sizing/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface WireSizingReferenceTables {
  ampacityRows: AmpacityTableRow[];
  insulationTempRatingRows: InsulationTypeTempRatingTableRow[];
  ambientTempCorrectionRows: AmbientTempCorrectionTableRow[];
  conductorCountAdjustmentRows: ConductorCountAdjustmentTableRow[];
}

interface UseWireSizingReferenceTablesResult extends WireSizingReferenceTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: WireSizingReferenceTables = {
  ampacityRows: EMPTY_LIST,
  insulationTempRatingRows: EMPTY_LIST,
  ambientTempCorrectionRows: EMPTY_LIST,
  conductorCountAdjustmentRows: EMPTY_LIST,
};

async function load(): Promise<WireSizingReferenceTables> {
  const [ampacityRows, insulationTempRatingRows, ambientTempCorrectionRows, conductorCountAdjustmentRows] =
    await Promise.all([
      getAmpacityTable(),
      getInsulationTypeTempRatingTable(),
      getAmbientTempCorrectionTable(),
      getConductorCountAdjustmentTable(),
    ]);
  return { ampacityRows, insulationTempRatingRows, ambientTempCorrectionRows, conductorCountAdjustmentRows };
}

/**
 * Fetches the four raw reference tables wire sizing's core ampacity calculation actually
 * pulls from, for display purposes only — separate from useWireSizingReferenceData, which
 * fetches the much smaller dropdown-population lists the form needs on every render. Mirrors
 * useConductorReferenceTables' role for voltage drop.
 */
export function useWireSizingReferenceTables(): UseWireSizingReferenceTablesResult {
  const { data, isLoading, error } = useReferenceData(
    "wire-sizing-reference-tables",
    load,
    "Failed to load reference tables.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
