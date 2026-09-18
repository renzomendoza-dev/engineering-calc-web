"use client";

import { getLockedRotorPolyphaseTable, getLockedRotorSinglePhaseTable } from "@/lib/reference-api";
import type { LockedRotorTableRow } from "@/features/locked-rotor/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface LockedRotorTables {
  singlePhaseRows: LockedRotorTableRow[];
  polyphaseRows: LockedRotorTableRow[];
}

interface UseLockedRotorTablesResult extends LockedRotorTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: LockedRotorTables = { singlePhaseRows: EMPTY_LIST, polyphaseRows: EMPTY_LIST };

async function load(): Promise<LockedRotorTables> {
  const [singlePhaseRows, polyphaseRows] = await Promise.all([
    getLockedRotorSinglePhaseTable(),
    getLockedRotorPolyphaseTable(),
  ]);
  return { singlePhaseRows, polyphaseRows };
}

/**
 * Fetches both locked-rotor reference tables (single-phase and polyphase are genuinely
 * separate source tables in calc-core, not one merged table like motor FLC), for display
 * purposes only.
 */
export function useLockedRotorTables(): UseLockedRotorTablesResult {
  const { data, isLoading, error } = useReferenceData(
    "locked-rotor-tables",
    load,
    "Failed to load reference tables.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
