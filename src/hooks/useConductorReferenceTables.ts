"use client";

import { getConductorDcResistanceTable, getConductorImpedanceTable } from "@/lib/reference-api";
import type {
  ConductorDcResistanceTableRow,
  ConductorImpedanceTableRow,
} from "@/features/voltage-drop/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface ConductorReferenceTables {
  impedanceRows: ConductorImpedanceTableRow[];
  dcResistanceRows: ConductorDcResistanceTableRow[];
}

interface UseConductorReferenceTablesResult extends ConductorReferenceTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: ConductorReferenceTables = { impedanceRows: EMPTY_LIST, dcResistanceRows: EMPTY_LIST };

async function load(): Promise<ConductorReferenceTables> {
  const [impedanceRows, dcResistanceRows] = await Promise.all([
    getConductorImpedanceTable(),
    getConductorDcResistanceTable(),
  ]);
  return { impedanceRows, dcResistanceRows };
}

/**
 * Fetches the full PEC reference tables (raw rows, as published) for display — separate
 * from useConductorReferenceData, which fetches the much smaller dropdown-population lists
 * (sizes/materials) that VoltageDropForm needs on every render. Only components that
 * actually display the full tables (e.g. VoltageDropFormula) should pull this in. Shared
 * under src/hooks/ since future calculators citing the same PEC tables will want it too.
 */
export function useConductorReferenceTables(): UseConductorReferenceTablesResult {
  const { data, isLoading, error } = useReferenceData(
    "conductor-reference-tables",
    load,
    "Failed to load reference tables.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
