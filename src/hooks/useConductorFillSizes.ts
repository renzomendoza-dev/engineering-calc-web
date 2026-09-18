"use client";

import { getConductorSizesForInsulationType } from "@/lib/reference-api";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseConductorFillSizesResult {
  sizes: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches conductor sizes for a single insulation type. Separate from
 * useConduitFillReferenceData because this is per-row state in a conduit fill form — each
 * conductor entry can have a different insulation type, so this re-fetches whenever the
 * given insulationType changes rather than once on mount. Nothing is fetched while
 * insulationType is empty.
 */
export function useConductorFillSizes(insulationType: string): UseConductorFillSizesResult {
  const { data, isLoading, error } = useReferenceData(
    insulationType ? `conductor-fill-sizes:${insulationType}` : null,
    () => getConductorSizesForInsulationType(insulationType),
    "Failed to load conductor sizes.",
  );
  return { sizes: data ?? EMPTY_LIST, isLoading, error };
}
