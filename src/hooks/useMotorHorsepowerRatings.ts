"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getMotorHorsepowerRatings } from "@/lib/reference-api";

interface UseMotorHorsepowerRatingsResult {
  horsepowerRatings: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches horsepower labels for a phase type (+ motor class, only when THREE_PHASE requires
 * one). Dependent lookup — re-fetches whenever phaseType or motorClass changes. Mirrors
 * conduit fill's per-row useConductorFillSizes.
 */
export function useMotorHorsepowerRatings(
  phaseType: string,
  motorClass: string,
  motorClassRequired: boolean,
): UseMotorHorsepowerRatingsResult {
  const [horsepowerRatings, setHorsepowerRatings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!phaseType && (!motorClassRequired || !!motorClass);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMotorHorsepowerRatings(phaseType, motorClass || undefined);
        if (cancelled) return;
        setHorsepowerRatings(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load horsepower ratings.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [phaseType, motorClass, ready]);

  if (!ready) {
    return { horsepowerRatings: [], isLoading: false, error: null };
  }
  return { horsepowerRatings, isLoading, error };
}
