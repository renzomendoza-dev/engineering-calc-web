"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getConductorMaterials, getConductorSizes, getConduitMaterials } from "@/lib/reference-api";
import type {
  ConductorMaterial,
  ConductorSizeOption,
  ConduitMaterial,
} from "@/features/voltage-drop/types";

interface UseConductorReferenceDataResult {
  conductorSizes: ConductorSizeOption[];
  conductorMaterials: ConductorMaterial[];
  conduitMaterials: ConduitMaterial[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the PEC conductor/conduit reference lists (sizes, materials) used to populate
 * dropdowns. Shared across every calculator that resolves conductor impedance from
 * reference tables — voltage drop today, wire sizing and conduit fill later — so it lives
 * under src/hooks/ rather than a single feature folder.
 */
export function useConductorReferenceData(): UseConductorReferenceDataResult {
  const [conductorSizes, setConductorSizes] = useState<ConductorSizeOption[]>([]);
  const [conductorMaterials, setConductorMaterials] = useState<ConductorMaterial[]>([]);
  const [conduitMaterials, setConduitMaterials] = useState<ConduitMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [sizes, materials, conduits] = await Promise.all([
          getConductorSizes(),
          getConductorMaterials(),
          getConduitMaterials(),
        ]);
        if (cancelled) return;
        setConductorSizes(sizes);
        setConductorMaterials(materials);
        setConduitMaterials(conduits);
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

  return { conductorSizes, conductorMaterials, conduitMaterials, isLoading, error };
}
