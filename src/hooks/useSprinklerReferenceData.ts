"use client";

import {
  getSprinklerCFactorsTable,
  getSprinklerFittingEquivalentLengthsTable,
  getSprinklerHazardPresetsTable,
  getSprinklerKFactorsTable,
} from "@/lib/reference-api";
import type {
  FittingEquivalentLengthTableRow,
  HazardPresetTableRow,
  SprinklerCFactorTableRow,
  SprinklerKFactorTableRow,
} from "@/features/sprinkler-hydraulics/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

export interface SprinklerReferenceTables {
  hazardPresets: HazardPresetTableRow[];
  kFactors: SprinklerKFactorTableRow[];
  cFactors: SprinklerCFactorTableRow[];
  fittings: FittingEquivalentLengthTableRow[];
}

export interface UseSprinklerReferenceDataResult extends SprinklerReferenceTables {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: SprinklerReferenceTables = {
  hazardPresets: EMPTY_LIST,
  kFactors: EMPTY_LIST,
  cFactors: EMPTY_LIST,
  fittings: EMPTY_LIST,
};

async function load(): Promise<SprinklerReferenceTables> {
  const [hazardPresets, kFactors, cFactors, fittings] = await Promise.all([
    getSprinklerHazardPresetsTable(),
    getSprinklerKFactorsTable(),
    getSprinklerCFactorsTable(),
    getSprinklerFittingEquivalentLengthsTable(),
  ]);
  return { hazardPresets, kFactors, cFactors, fittings };
}

/**
 * Fetches the four published tables the sprinkler form reads from: hazard presets (which fill the
 * density, design area and hose stream figures), sprinkler K factors, pipe C factors, and fitting
 * equivalent lengths. One request each, in parallel, loaded once for the whole five-step flow.
 */
export function useSprinklerReferenceData(): UseSprinklerReferenceDataResult {
  const { data, isLoading, error } = useReferenceData(
    "sprinkler-reference-data",
    load,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
