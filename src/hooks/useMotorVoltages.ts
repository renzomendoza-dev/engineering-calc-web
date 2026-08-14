"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getMotorVoltages } from "@/lib/reference-api";

interface UseMotorVoltagesResult {
  voltages: number[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches published voltages for a phase type (+ motor class) + horsepower label
 * combination. Dependent lookup — re-fetches whenever any of those three change. Mirrors
 * conduit fill's per-row useConductorFillSizes.
 */
export function useMotorVoltages(
  phaseType: string,
  motorClass: string,
  motorClassRequired: boolean,
  horsepowerLabel: string,
): UseMotorVoltagesResult {
  const [voltages, setVoltages] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!phaseType && (!motorClassRequired || !!motorClass) && !!horsepowerLabel;

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMotorVoltages(phaseType, motorClass || undefined, horsepowerLabel);
        if (cancelled) return;
        setVoltages(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load voltages.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [phaseType, motorClass, horsepowerLabel, ready]);

  if (!ready) {
    return { voltages: [], isLoading: false, error: null };
  }
  return { voltages, isLoading, error };
}
