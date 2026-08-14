"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getPipeMaterials } from "@/lib/reference-api";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";

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
  const [materials, setMaterials] = useState<PipeMaterialOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPipeMaterials();
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
