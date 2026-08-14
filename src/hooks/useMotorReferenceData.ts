"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getMotorClasses, getMotorPhaseTypes } from "@/lib/reference-api";

interface UseMotorReferenceDataResult {
  motorPhaseTypes: string[];
  motorClasses: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches motor phase types and motor classes once on mount — neither depends on user
 * input. Horsepower ratings and voltages are deliberately NOT part of this hook: they're
 * dependent lookups (horsepower depends on phaseType + motorClass, voltage depends on
 * horsepower too), fetched directly inside MotorFlcForm via local effects that re-run as
 * those upstream fields change — same reasoning as conduit fill's per-row
 * useConductorFillSizes being separate from its mount-once reference hook.
 */
export function useMotorReferenceData(): UseMotorReferenceDataResult {
  const [motorPhaseTypes, setMotorPhaseTypes] = useState<string[]>([]);
  const [motorClasses, setMotorClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [phaseTypes, classes] = await Promise.all([getMotorPhaseTypes(), getMotorClasses()]);
        if (cancelled) return;
        setMotorPhaseTypes(phaseTypes);
        setMotorClasses(classes);
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

  return { motorPhaseTypes, motorClasses, isLoading, error };
}
