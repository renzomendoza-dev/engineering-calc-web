"use client";

import { getMotorHorsepowerRatings } from "@/lib/reference-api";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseMotorHorsepowerRatingsResult {
  horsepowerRatings: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches horsepower labels for a phase type (+ motor class, only when THREE_PHASE requires
 * one). Dependent lookup — re-fetches whenever phaseType or motorClass changes, and fetches
 * nothing until the required selections are made. Mirrors conduit fill's per-row
 * useConductorFillSizes.
 */
export function useMotorHorsepowerRatings(
  phaseType: string,
  motorClass: string,
  motorClassRequired: boolean,
): UseMotorHorsepowerRatingsResult {
  const ready = !!phaseType && (!motorClassRequired || !!motorClass);
  const { data, isLoading, error } = useReferenceData(
    ready ? `motor-horsepower-ratings:${phaseType}:${motorClass}` : null,
    () => getMotorHorsepowerRatings(phaseType, motorClass || undefined),
    "Failed to load horsepower ratings.",
  );
  return { horsepowerRatings: data ?? EMPTY_LIST, isLoading, error };
}
