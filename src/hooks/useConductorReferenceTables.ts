"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getConductorDcResistanceTable, getConductorImpedanceTable } from "@/lib/reference-api";
import type {
  ConductorDcResistanceTableRow,
  ConductorImpedanceTableRow,
} from "@/features/voltage-drop/types";

interface UseConductorReferenceTablesResult {
  impedanceRows: ConductorImpedanceTableRow[];
  dcResistanceRows: ConductorDcResistanceTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the full PEC reference tables (raw rows, as published) for display — separate
 * from useConductorReferenceData, which fetches the much smaller dropdown-population lists
 * (sizes/materials) that VoltageDropForm needs on every render. Only components that
 * actually display the full tables (e.g. VoltageDropFormula) should pull this in. Shared
 * under src/hooks/ since future calculators citing the same PEC tables will want it too.
 */
export function useConductorReferenceTables(): UseConductorReferenceTablesResult {
  const [impedanceRows, setImpedanceRows] = useState<ConductorImpedanceTableRow[]>([]);
  const [dcResistanceRows, setDcResistanceRows] = useState<ConductorDcResistanceTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [impedance, dcResistance] = await Promise.all([
          getConductorImpedanceTable(),
          getConductorDcResistanceTable(),
        ]);
        if (cancelled) return;
        setImpedanceRows(impedance);
        setDcResistanceRows(dcResistance);
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

  return { impedanceRows, dcResistanceRows, isLoading, error };
}
