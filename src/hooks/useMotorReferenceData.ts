"use client";

import { getMotorClasses, getMotorPhaseTypes } from "@/lib/reference-api";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface MotorReferenceData {
  motorPhaseTypes: string[];
  motorClasses: string[];
}

interface UseMotorReferenceDataResult extends MotorReferenceData {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: MotorReferenceData = { motorPhaseTypes: EMPTY_LIST, motorClasses: EMPTY_LIST };

async function load(): Promise<MotorReferenceData> {
  const [motorPhaseTypes, motorClasses] = await Promise.all([getMotorPhaseTypes(), getMotorClasses()]);
  return { motorPhaseTypes, motorClasses };
}

/**
 * Fetches motor phase types and motor classes once on mount — neither depends on user
 * input. Horsepower ratings and voltages are deliberately NOT part of this hook: they're
 * dependent lookups (horsepower depends on phaseType + motorClass, voltage depends on
 * horsepower too), fetched by useMotorHorsepowerRatings and useMotorVoltages, which re-fetch
 * as those upstream fields change — same reasoning as conduit fill's per-row
 * useConductorFillSizes being separate from its mount-once reference hook.
 */
export function useMotorReferenceData(): UseMotorReferenceDataResult {
  const { data, isLoading, error } = useReferenceData(
    "motor-reference-data",
    load,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
