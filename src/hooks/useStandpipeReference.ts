"use client";

import { getStandpipeReference } from "@/lib/reference-api";
import type { StandpipeReference } from "@/features/standpipe-hydraulics/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseStandpipeReferenceResult extends StandpipeReference {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: StandpipeReference = {
  edition: "",
  note: "",
  fittings: EMPTY_LIST,
  cFactors: EMPTY_LIST,
};

/** Fetches the equivalent length chart and C table once on mount; neither depends on user input. */
export function useStandpipeReference(): UseStandpipeReferenceResult {
  const { data, isLoading, error } = useReferenceData(
    "standpipe-reference",
    getStandpipeReference,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
