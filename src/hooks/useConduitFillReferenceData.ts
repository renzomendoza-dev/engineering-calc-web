"use client";

import { getConduitFillTypes, getInsulationTypes } from "@/lib/reference-api";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface ConduitFillReferenceData {
  insulationTypes: string[];
  conduitFillTypes: string[];
}

interface UseConduitFillReferenceDataResult extends ConduitFillReferenceData {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: ConduitFillReferenceData = { insulationTypes: EMPTY_LIST, conduitFillTypes: EMPTY_LIST };

async function load(): Promise<ConduitFillReferenceData> {
  const [insulationTypes, conduitFillTypes] = await Promise.all([
    getInsulationTypes(),
    getConduitFillTypes(),
  ]);
  return { insulationTypes, conduitFillTypes };
}

/**
 * Fetches conduit fill's insulation-type and conduit-type lists once on mount — neither
 * depends on user input. Conductor sizes are deliberately NOT part of this hook: they're
 * scoped to a single conductor row's chosen insulation type, so they're fetched per-row via
 * useConductorFillSizes instead.
 */
export function useConduitFillReferenceData(): UseConduitFillReferenceDataResult {
  const { data, isLoading, error } = useReferenceData(
    "conduit-fill-reference-data",
    load,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
