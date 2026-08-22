"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getDuctRoughnessTable } from "@/lib/reference-api";
import type { DuctRoughnessTableRow } from "@/features/duct-sizing/types";

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
  const [materials, setMaterials] = useState<DuctRoughnessTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getDuctRoughnessTable();
        if (cancelled) return;
        setMaterials(result);
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

  return { materials, isLoading, error };
}
