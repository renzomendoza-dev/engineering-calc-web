"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getDuctVelocityLimitsTable } from "@/lib/reference-api";
import type { DuctVelocityLimitTableRow } from "@/features/duct-sizing/types";

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
  const [rows, setRows] = useState<DuctVelocityLimitTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getDuctVelocityLimitsTable();
        if (cancelled) return;
        setRows(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reference data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, isLoading, error };
}
