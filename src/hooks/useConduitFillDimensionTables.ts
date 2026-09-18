"use client";

import { getConductorDimensionTable, getConduitDimensionTable } from "@/lib/reference-api";
import type {
  ConductorDimensionTableRow,
  ConduitDimensionTableRow,
} from "@/features/conduit-fill/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface ConduitFillDimensionTables {
  conductorDimensionRows: ConductorDimensionTableRow[];
  conduitDimensionRows: ConduitDimensionTableRow[];
}

interface UseConduitFillDimensionTablesResult extends ConduitFillDimensionTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: ConduitFillDimensionTables = {
  conductorDimensionRows: EMPTY_LIST,
  conduitDimensionRows: EMPTY_LIST,
};

async function load(): Promise<ConduitFillDimensionTables> {
  const [conductorDimensionRows, conduitDimensionRows] = await Promise.all([
    getConductorDimensionTable(),
    getConduitDimensionTable(),
  ]);
  return { conductorDimensionRows, conduitDimensionRows };
}

/**
 * Fetches the full PEC reference tables (raw rows, as published) backing conduit fill's
 * area calculation, for display purposes only — separate from useConduitFillReferenceData,
 * which fetches the much smaller dropdown-population lists the form needs on every render.
 * Mirrors useConductorReferenceTables' role for voltage drop.
 */
export function useConduitFillDimensionTables(): UseConduitFillDimensionTablesResult {
  const { data, isLoading, error } = useReferenceData(
    "conduit-fill-dimension-tables",
    load,
    "Failed to load reference tables.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
