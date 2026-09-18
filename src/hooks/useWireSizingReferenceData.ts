"use client";

import {
  getConductorMaterials,
  getConduitMaterials,
  getInsulationTypes,
  getTerminationTempRatings,
} from "@/lib/reference-api";
import type { ConductorMaterial, ConduitMaterial } from "@/features/voltage-drop/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface WireSizingReferenceData {
  insulationTypes: string[];
  conductorMaterials: ConductorMaterial[];
  conduitMaterials: ConduitMaterial[];
  terminationTempRatings: number[];
}

interface UseWireSizingReferenceDataResult extends WireSizingReferenceData {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: WireSizingReferenceData = {
  insulationTypes: EMPTY_LIST,
  conductorMaterials: EMPTY_LIST,
  conduitMaterials: EMPTY_LIST,
  terminationTempRatings: EMPTY_LIST,
};

async function load(): Promise<WireSizingReferenceData> {
  const [insulationTypes, conductorMaterials, conduitMaterials, terminationTempRatings] =
    await Promise.all([
      getInsulationTypes(),
      getConductorMaterials(),
      getConduitMaterials(),
      getTerminationTempRatings(),
    ]);
  return { insulationTypes, conductorMaterials, conduitMaterials, terminationTempRatings };
}

/**
 * Fetches every reference list wire sizing's form needs on mount: insulation types and
 * conductor materials (reused from the existing reference-api.ts functions, same lists
 * conduit fill and voltage drop already fetch), conduit materials (reused from voltage
 * drop's, needed only when the voltage drop check sub-section is shown), and termination
 * temperature ratings (new to this feature).
 */
export function useWireSizingReferenceData(): UseWireSizingReferenceDataResult {
  const { data, isLoading, error } = useReferenceData(
    "wire-sizing-reference-data",
    load,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
