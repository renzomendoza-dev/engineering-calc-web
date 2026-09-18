"use client";

import { getConductorMaterials, getConductorSizes, getConduitMaterials } from "@/lib/reference-api";
import type {
  ConductorMaterial,
  ConductorSizeOption,
  ConduitMaterial,
} from "@/features/voltage-drop/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface ConductorReferenceData {
  conductorSizes: ConductorSizeOption[];
  conductorMaterials: ConductorMaterial[];
  conduitMaterials: ConduitMaterial[];
}

interface UseConductorReferenceDataResult extends ConductorReferenceData {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: ConductorReferenceData = {
  conductorSizes: EMPTY_LIST,
  conductorMaterials: EMPTY_LIST,
  conduitMaterials: EMPTY_LIST,
};

async function load(): Promise<ConductorReferenceData> {
  const [conductorSizes, conductorMaterials, conduitMaterials] = await Promise.all([
    getConductorSizes(),
    getConductorMaterials(),
    getConduitMaterials(),
  ]);
  return { conductorSizes, conductorMaterials, conduitMaterials };
}

/**
 * Fetches the PEC conductor/conduit reference lists (sizes, materials) used to populate
 * dropdowns. Shared across every calculator that resolves conductor impedance from
 * reference tables — voltage drop today, wire sizing and conduit fill later — so it lives
 * under src/hooks/ rather than a single feature folder.
 */
export function useConductorReferenceData(): UseConductorReferenceDataResult {
  const { data, isLoading, error } = useReferenceData(
    "conductor-reference-data",
    load,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
