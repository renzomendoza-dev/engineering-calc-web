"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiPost } from "@/lib/api-client";
import { toSprinklerRequest, unresolvedFittingPaths } from "./request";
import { sprinklerHydraulicsSchema, type SprinklerFormInput } from "./schema";
import type {
  FittingEquivalentLengthTableRow,
  SprinklerHydraulicRequest,
  SprinklerHydraulicResponse,
} from "./types";

export const SPRINKLER_HYDRAULICS_PATH = "/api/mechanical/sprinkler/hydraulics";
export const CALCULATION_DEBOUNCE_MS = 400;

export interface SprinklerCalculationState {
  /** The last successful response, or null before the first one. */
  result: SprinklerHydraulicResponse | null;
  /** True while a request is in flight. */
  isCalculating: boolean;
  /** The error from the request for the current input, raw, for useApiFormError to place. */
  error: unknown;
  /** True when the form no longer matches `result` — being edited, or not yet complete. */
  isStale: boolean;
  /** True when the current input would be sent: schema-valid and every fitting resolvable. */
  isComplete: boolean;
}

/**
 * The request body for the current form state, as JSON, or null when it isn't sendable yet.
 * A string rather than an object so identical input produces an identical value — that's what
 * keeps the debounce from restarting, and the request from repeating, on every keystroke that
 * doesn't actually change the payload.
 */
function buildPayload(
  values: SprinklerFormInput,
  fittings: FittingEquivalentLengthTableRow[],
): string | null {
  const parsed = sprinklerHydraulicsSchema.safeParse(values);
  if (!parsed.success) return null;
  // A fitting with no published length and no typed-in length would be rejected by the API.
  if (unresolvedFittingPaths(parsed.data, fittings).length > 0) return null;
  return JSON.stringify(toSprinklerRequest(parsed.data));
}

/** A finished request, kept with the payload that produced it. */
interface Resolved<T> {
  payload: string;
  value: T;
}

/**
 * Runs the hydraulic calculation on the API as the user edits, 400 ms after they stop.
 *
 * Every number the UI shows comes from the response — nothing here recomputes flow, friction,
 * pressure or margin. Requests are only sent for input that passes the whole schema, so an
 * incomplete form never calls the endpoint. A newer request aborts the one in flight, and a
 * response that arrives after its input changed is discarded (the effect's cleanup runs before
 * the next one starts, so a late reply can't overwrite a newer result).
 *
 * Both outcomes are stored against their own payload, which makes "is a request in flight?" and
 * "does this error belong to what's on screen?" comparisons rather than extra state the effect
 * would have to set synchronously.
 */
export function useSprinklerCalculation(
  values: SprinklerFormInput,
  fittings: FittingEquivalentLengthTableRow[],
): SprinklerCalculationState {
  const payload = buildPayload(values, fittings);
  const debouncedPayload = useDebouncedValue(payload, CALCULATION_DEBOUNCE_MS);

  const [outcome, setOutcome] = useState<Resolved<SprinklerHydraulicResponse> | null>(null);
  const [failure, setFailure] = useState<Resolved<unknown> | null>(null);

  useEffect(() => {
    if (debouncedPayload === null) return;

    const controller = new AbortController();
    let cancelled = false;

    apiPost<SprinklerHydraulicRequest, SprinklerHydraulicResponse>(
      SPRINKLER_HYDRAULICS_PATH,
      JSON.parse(debouncedPayload) as SprinklerHydraulicRequest,
      { signal: controller.signal },
    )
      .then((response) => {
        if (cancelled) return;
        setOutcome({ payload: debouncedPayload, value: response });
      })
      .catch((err: unknown) => {
        // An abort is this hook superseding its own request; the newer one reports the outcome.
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setFailure({ payload: debouncedPayload, value: err });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedPayload]);

  const settled =
    debouncedPayload !== null &&
    (outcome?.payload === debouncedPayload || failure?.payload === debouncedPayload);

  return {
    result: outcome?.value ?? null,
    isCalculating: debouncedPayload !== null && !settled,
    // An error from an input the user has already moved on from isn't reported.
    error: failure?.payload === debouncedPayload ? failure.value : null,
    isStale: outcome !== null && outcome.payload !== payload,
    isComplete: payload !== null,
  };
}
