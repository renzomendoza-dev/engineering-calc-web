"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getConductorDimensionTable, getConduitDimensionTable } from "@/lib/reference-api";
import type {
  ConductorDimensionTableRow,
  ConduitDimensionTableRow,
} from "@/features/conduit-fill/types";

interface UseConduitFillDimensionTablesResult {
  conductorDimensionRows: ConductorDimensionTableRow[];
  conduitDimensionRows: ConduitDimensionTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the full PEC reference tables (raw rows, as published) backing conduit fill's
 * area calculation, for display purposes only — separate from useConduitFillReferenceData,
 * which fetches the much smaller dropdown-population lists the form needs on every render.
 * Mirrors useConductorReferenceTables' role for voltage drop.
 */
export function useConduitFillDimensionTables(): UseConduitFillDimensionTablesResult {
  const [conductorDimensionRows, setConductorDimensionRows] = useState<
    ConductorDimensionTableRow[]
  >([]);
  const [conduitDimensionRows, setConduitDimensionRows] = useState<ConduitDimensionTableRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [conductorRows, conduitRows] = await Promise.all([
          getConductorDimensionTable(),
          getConduitDimensionTable(),
        ]);
        if (cancelled) return;
        setConductorDimensionRows(conductorRows);
        setConduitDimensionRows(conduitRows);
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

  return { conductorDimensionRows, conduitDimensionRows, isLoading, error };
}
