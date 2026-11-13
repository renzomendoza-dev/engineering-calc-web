"use client";

import {
  getAmbientTempCorrectionTable,
  getAmpacityTable,
  getConductorCountAdjustmentTable,
  getInsulationTypeTempRatingTable,
  getSmallConductorLimitTable,
  getStandardAmpereRatings,
} from "@/lib/reference-api";
import type {
  AmbientTempCorrectionTableRow,
  AmpacityTableRow,
  ConductorCountAdjustmentTableRow,
  InsulationTypeTempRatingTableRow,
  SmallConductorLimitTableRow,
  StandardAmpereRatings,
} from "@/features/wire-sizing/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface WireSizingReferenceTables {
  ampacityRows: AmpacityTableRow[];
  insulationTempRatingRows: InsulationTypeTempRatingTableRow[];
  ambientTempCorrectionRows: AmbientTempCorrectionTableRow[];
  conductorCountAdjustmentRows: ConductorCountAdjustmentTableRow[];
  smallConductorLimitRows: SmallConductorLimitTableRow[];
  standardAmpereRatings: StandardAmpereRatings | null;
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
  smallConductorLimitRows: EMPTY_LIST,
  standardAmpereRatings: null,
};

async function load(): Promise<WireSizingReferenceTables> {
  const [
    ampacityRows,
    insulationTempRatingRows,
    ambientTempCorrectionRows,
    conductorCountAdjustmentRows,
    smallConductorLimitRows,
    standardAmpereRatings,
  ] = await Promise.all([
    getAmpacityTable(),
    getInsulationTypeTempRatingTable(),
    getAmbientTempCorrectionTable(),
    getConductorCountAdjustmentTable(),
    getSmallConductorLimitTable(),
    getStandardAmpereRatings(),
  ]);
  return {
    ampacityRows,
    insulationTempRatingRows,
    ambientTempCorrectionRows,
    conductorCountAdjustmentRows,
    smallConductorLimitRows,
    standardAmpereRatings,
  };
}

/**
 * Fetches the raw reference tables wire sizing's calculation pulls from (the four ampacity and
 * derating tables, and the 2.40.1.4 overcurrent limits), for display purposes only — separate from useWireSizingReferenceData, which
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
