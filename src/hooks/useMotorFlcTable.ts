"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getMotorFlcTable } from "@/lib/reference-api";
import type { MotorFlcTableRow } from "@/features/motor-flc/types";

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
  const [rows, setRows] = useState<MotorFlcTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMotorFlcTable();
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
