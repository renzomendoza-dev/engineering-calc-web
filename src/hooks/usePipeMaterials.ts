"use client";

import { getPipeMaterials } from "@/lib/reference-api";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UsePipeMaterialsResult {
  materials: PipeMaterialOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the pipe material/schedule/nominal-size reference catalog used to populate the
 * pipe velocity/sizing calculator's dropdowns.
 */
export function usePipeMaterials(): UsePipeMaterialsResult {
  const { data, isLoading, error } = useReferenceData(
    "pipe-materials",
    getPipeMaterials,
    "Failed to load reference data.",
  );
  return { materials: data ?? EMPTY_LIST, isLoading, error };
}
