"use client";

import { getLpcdConsumptionTable, getWsfuDemandTable } from "@/lib/reference-api";
import type { OccupancyTypeTableRow, WsfuDemandTableRow } from "@/features/domestic-water-storage/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface DomesticWaterStorageReferenceTables {
  lpcdRows: OccupancyTypeTableRow[];
  wsfuRows: WsfuDemandTableRow[];
}

interface UseDomesticWaterStorageReferenceTablesResult extends DomesticWaterStorageReferenceTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: DomesticWaterStorageReferenceTables = { lpcdRows: EMPTY_LIST, wsfuRows: EMPTY_LIST };

async function load(): Promise<DomesticWaterStorageReferenceTables> {
  const [lpcdRows, wsfuRows] = await Promise.all([getLpcdConsumptionTable(), getWsfuDemandTable()]);
  return { lpcdRows, wsfuRows };
}

/**
 * Fetches the two raw reference tables Domestic Water Storage's two demand-basis modes
 * actually pull from, for display purposes only — separate from any per-render dropdown
 * data (this calculator has none fetched from the backend; OCCUPANT_LOAD's occupancy types
 * are a client-side constant). Mirrors useWireSizingReferenceTables' role for Wire Sizing.
 */
export function useDomesticWaterStorageReferenceTables(): UseDomesticWaterStorageReferenceTablesResult {
  const { data, isLoading, error } = useReferenceData(
    "domestic-water-storage-reference-tables",
    load,
    "Failed to load reference tables.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
