"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getConductorSizesForInsulationType } from "@/lib/reference-api";

interface UseConductorFillSizesResult {
  sizes: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches conductor sizes for a single insulation type. Separate from
 * useConduitFillReferenceData because this is per-row state in a conduit fill form — each
 * conductor entry can have a different insulation type, so this re-fetches whenever the
 * given insulationType changes rather than once on mount.
 */
export function useConductorFillSizes(insulationType: string): UseConductorFillSizesResult {
  const [sizes, setSizes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!insulationType) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getConductorSizesForInsulationType(insulationType);
        if (cancelled) return;
        setSizes(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load conductor sizes.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [insulationType]);

  // Derived rather than reset via the effect above: as soon as insulationType is cleared,
  // stale sizes/error from a previous selection shouldn't linger for even one extra render.
  if (!insulationType) {
    return { sizes: [], isLoading: false, error: null };
  }
  return { sizes, isLoading, error };
}
