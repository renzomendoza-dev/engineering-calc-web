"use client";

import { getDuctRoughnessTable } from "@/lib/reference-api";
import type { DuctRoughnessTableRow } from "@/features/duct-sizing/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseDuctRoughnessMaterialsResult {
  materials: DuctRoughnessTableRow[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the duct material/roughness reference catalog used to populate Duct Sizing's
 * material dropdown — a required form input, not an optional reference display, same role
 * as usePipeMaterials for pipe velocity/sizing.
 */
export function useDuctRoughnessMaterials(): UseDuctRoughnessMaterialsResult {
  const { data, isLoading, error } = useReferenceData(
    "duct-roughness",
    getDuctRoughnessTable,
    "Failed to load reference data.",
  );
  return { materials: data ?? EMPTY_LIST, isLoading, error };
}
