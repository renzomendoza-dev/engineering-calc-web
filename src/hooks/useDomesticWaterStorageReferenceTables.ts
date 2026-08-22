"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getLpcdConsumptionTable, getWsfuDemandTable } from "@/lib/reference-api";
import type { OccupancyTypeTableRow, WsfuDemandTableRow } from "@/features/domestic-water-storage/types";

interface UseDomesticWaterStorageReferenceTablesResult {
  lpcdRows: OccupancyTypeTableRow[];
  wsfuRows: WsfuDemandTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the two raw reference tables Domestic Water Storage's two demand-basis modes
 * actually pull from, for display purposes only — separate from any per-render dropdown
 * data (this calculator has none fetched from the backend; OCCUPANT_LOAD's occupancy types
 * are a client-side constant). Mirrors useWireSizingReferenceTables' role for Wire Sizing.
 */
export function useDomesticWaterStorageReferenceTables(): UseDomesticWaterStorageReferenceTablesResult {
  const [lpcdRows, setLpcdRows] = useState<OccupancyTypeTableRow[]>([]);
  const [wsfuRows, setWsfuRows] = useState<WsfuDemandTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [lpcd, wsfu] = await Promise.all([getLpcdConsumptionTable(), getWsfuDemandTable()]);
        if (cancelled) return;
        setLpcdRows(lpcd);
        setWsfuRows(wsfu);
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

  return { lpcdRows, wsfuRows, isLoading, error };
}
