"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getFireWaterDurationTable } from "@/lib/reference-api";
import type { FireWaterDurationTableRow } from "@/features/fire-water-storage/types";

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
  const [rows, setRows] = useState<FireWaterDurationTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getFireWaterDurationTable();
        if (cancelled) return;
        setRows(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reference table.");
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
