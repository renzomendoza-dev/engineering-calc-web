"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import {
  getConductorMaterials,
  getConduitMaterials,
  getInsulationTypes,
  getTerminationTempRatings,
} from "@/lib/reference-api";
import type { ConductorMaterial, ConduitMaterial } from "@/features/voltage-drop/types";

interface UseWireSizingReferenceDataResult {
  insulationTypes: string[];
  conductorMaterials: ConductorMaterial[];
  conduitMaterials: ConduitMaterial[];
  terminationTempRatings: number[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches every reference list wire sizing's form needs on mount: insulation types and
 * conductor materials (reused from the existing reference-api.ts functions, same lists
 * conduit fill and voltage drop already fetch), conduit materials (reused from voltage
 * drop's, needed only when the voltage drop check sub-section is shown), and termination
 * temperature ratings (new to this feature).
 */
export function useWireSizingReferenceData(): UseWireSizingReferenceDataResult {
  const [insulationTypes, setInsulationTypes] = useState<string[]>([]);
  const [conductorMaterials, setConductorMaterials] = useState<ConductorMaterial[]>([]);
  const [conduitMaterials, setConduitMaterials] = useState<ConduitMaterial[]>([]);
  const [terminationTempRatings, setTerminationTempRatings] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [insulation, conductorMats, conduitMats, terminationRatings] = await Promise.all([
          getInsulationTypes(),
          getConductorMaterials(),
          getConduitMaterials(),
          getTerminationTempRatings(),
        ]);
        if (cancelled) return;
        setInsulationTypes(insulation);
        setConductorMaterials(conductorMats);
        setConduitMaterials(conduitMats);
        setTerminationTempRatings(terminationRatings);
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

  return {
    insulationTypes,
    conductorMaterials,
    conduitMaterials,
    terminationTempRatings,
    isLoading,
    error,
  };
}
