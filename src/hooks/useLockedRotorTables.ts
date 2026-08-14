"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getLockedRotorPolyphaseTable, getLockedRotorSinglePhaseTable } from "@/lib/reference-api";
import type { LockedRotorTableRow } from "@/features/locked-rotor/types";

interface UseLockedRotorTablesResult {
  singlePhaseRows: LockedRotorTableRow[];
  polyphaseRows: LockedRotorTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches both locked-rotor reference tables (single-phase and polyphase are genuinely
 * separate source tables in calc-core, not one merged table like motor FLC), for display
 * purposes only.
 */
export function useLockedRotorTables(): UseLockedRotorTablesResult {
  const [singlePhaseRows, setSinglePhaseRows] = useState<LockedRotorTableRow[]>([]);
  const [polyphaseRows, setPolyphaseRows] = useState<LockedRotorTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [singlePhase, polyphase] = await Promise.all([
          getLockedRotorSinglePhaseTable(),
          getLockedRotorPolyphaseTable(),
        ]);
        if (cancelled) return;
        setSinglePhaseRows(singlePhase);
        setPolyphaseRows(polyphase);
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

  return { singlePhaseRows, polyphaseRows, isLoading, error };
}
