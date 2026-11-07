"use client";

import { getNaturalVentingReference } from "@/lib/reference-api";
import type { NaturalVentingReference } from "@/features/natural-venting/types";
import { EMPTY_LIST, useReferenceData } from "./useReferenceData";

interface UseNaturalVentingReferenceResult extends NaturalVentingReference {
  isLoading: boolean;
  error: string | null;
}

const EMPTY: NaturalVentingReference = {
  edition: "",
  note: "",
  dischargeCoefficients: EMPTY_LIST,
  commodities: EMPTY_LIST,
};

/** Fetches the two NFPA 204 tables once on mount; neither depends on user input. */
export function useNaturalVentingReference(): UseNaturalVentingReferenceResult {
  const { data, isLoading, error } = useReferenceData(
    "natural-venting-reference",
    getNaturalVentingReference,
    "Failed to load reference data.",
  );
  return { ...(data ?? EMPTY), isLoading, error };
}
