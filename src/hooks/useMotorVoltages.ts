"use client";

import { getMotorVoltages } from "@/lib/reference-api";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseMotorVoltagesResult {
  voltages: number[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches published voltages for a phase type (+ motor class) + horsepower label
 * combination. Dependent lookup — re-fetches whenever any of those three change, and fetches
 * nothing until the required selections are made. Mirrors conduit fill's per-row
 * useConductorFillSizes.
 */
export function useMotorVoltages(
  phaseType: string,
  motorClass: string,
  motorClassRequired: boolean,
  horsepowerLabel: string,
): UseMotorVoltagesResult {
  const ready = !!phaseType && (!motorClassRequired || !!motorClass) && !!horsepowerLabel;
  const { data, isLoading, error } = useReferenceData(
    ready ? `motor-voltages:${phaseType}:${motorClass}:${horsepowerLabel}` : null,
    () => getMotorVoltages(phaseType, motorClass || undefined, horsepowerLabel),
    "Failed to load voltages.",
  );
  return { voltages: data ?? EMPTY_LIST, isLoading, error };
}
