"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getConduitFillTypes, getInsulationTypes } from "@/lib/reference-api";

interface UseConduitFillReferenceDataResult {
  insulationTypes: string[];
  conduitFillTypes: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches conduit fill's insulation-type and conduit-type lists once on mount — neither
 * depends on user input. Conductor sizes are deliberately NOT part of this hook: they're
 * scoped to a single conductor row's chosen insulation type, so they're fetched per-row via
 * useConductorFillSizes instead.
 */
export function useConduitFillReferenceData(): UseConduitFillReferenceDataResult {
  const [insulationTypes, setInsulationTypes] = useState<string[]>([]);
  const [conduitFillTypes, setConduitFillTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [insulation, conduits] = await Promise.all([
          getInsulationTypes(),
          getConduitFillTypes(),
        ]);
        if (cancelled) return;
        setInsulationTypes(insulation);
        setConduitFillTypes(conduits);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reference data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { insulationTypes, conduitFillTypes, isLoading, error };
}
