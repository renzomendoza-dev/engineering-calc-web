"use client";

import { getGeneratorSetReference } from "@/lib/reference-api";
import type { GeneratorSetReference } from "@/features/generator-set-sizing/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseGeneratorSetReferenceResult extends GeneratorSetReference {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: GeneratorSetReference = {
  lightingOccupancies: EMPTY_LIST,
  lightingAreaTypes: EMPTY_LIST,
  standbyClasses: EMPTY_LIST,
  optionalTransfers: EMPTY_LIST,
  standardSizesKva: EMPTY_LIST,
  standardSizesNote: "",
  defaultGeneratorPowerFactor: 0.8,
  defaultGeneratorPowerFactorNote: "",
  defaultSubtransientReactancePercent: 0,
  defaultMaximumVoltageDipPercent: 0,
  motorStartingDefaultsNote: "",
  defaultFirePumpStartingPowerFactor: 0,
  defaultFirePumpRunningPowerFactor: 0,
  defaultCableStartingDropAllowancePercent: 0,
  firePumpDefaultsNote: "",
};

/** Fetches generator set sizing's dropdown data once on mount; none of it depends on user input. */
export function useGeneratorSetReference(): UseGeneratorSetReferenceResult {
  const { data, isLoading, error } = useReferenceData(
    "generator-set-reference",
    getGeneratorSetReference,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
