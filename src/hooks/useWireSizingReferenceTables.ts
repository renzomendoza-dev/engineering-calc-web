"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
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

interface UseWireSizingReferenceTablesResult {
  ampacityRows: AmpacityTableRow[];
  insulationTempRatingRows: InsulationTypeTempRatingTableRow[];
  ambientTempCorrectionRows: AmbientTempCorrectionTableRow[];
  conductorCountAdjustmentRows: ConductorCountAdjustmentTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the four raw reference tables wire sizing's core ampacity calculation actually
 * pulls from, for display purposes only — separate from useWireSizingReferenceData, which
 * fetches the much smaller dropdown-population lists the form needs on every render. Mirrors
 * useConductorReferenceTables' role for voltage drop.
 */
export function useWireSizingReferenceTables(): UseWireSizingReferenceTablesResult {
  const [ampacityRows, setAmpacityRows] = useState<AmpacityTableRow[]>([]);
  const [insulationTempRatingRows, setInsulationTempRatingRows] = useState<
    InsulationTypeTempRatingTableRow[]
  >([]);
  const [ambientTempCorrectionRows, setAmbientTempCorrectionRows] = useState<
    AmbientTempCorrectionTableRow[]
  >([]);
  const [conductorCountAdjustmentRows, setConductorCountAdjustmentRows] = useState<
    ConductorCountAdjustmentTableRow[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [ampacity, insulationTempRating, ambientTempCorrection, conductorCountAdjustment] =
          await Promise.all([
            getAmpacityTable(),
            getInsulationTypeTempRatingTable(),
            getAmbientTempCorrectionTable(),
            getConductorCountAdjustmentTable(),
          ]);
        if (cancelled) return;
        setAmpacityRows(ampacity);
        setInsulationTempRatingRows(insulationTempRating);
        setAmbientTempCorrectionRows(ambientTempCorrection);
        setConductorCountAdjustmentRows(conductorCountAdjustment);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reference tables.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ampacityRows,
    insulationTempRatingRows,
    ambientTempCorrectionRows,
    conductorCountAdjustmentRows,
    isLoading,
    error,
  };
}
