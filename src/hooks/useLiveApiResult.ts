"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiPost } from "@/lib/api-client";

export const LIVE_REQUEST_DEBOUNCE_MS = 400;

export interface LiveApiResultState<TResponse> {
  /** The last successful response, or null before the first one. */
  result: TResponse | null;
  /** True while a request for the current input is in flight. */
  isCalculating: boolean;
  /** The error from the request for the current input, raw, for useApiFormError to place. */
  error: unknown;
  /** True when `result` no longer matches the input: being edited, or not yet sendable. */
  isStale: boolean;
  /** True when there is a payload to send at all. */
  isComplete: boolean;
}

/** A finished request, kept with the payload that produced it. */
interface Resolved<T> {
  payload: string;
  value: T;
}

/**
 * POSTs `payload` to `path` 400 ms after it stops changing, cancelling a request that a newer one
 * supersedes and discarding any reply that arrives after its input changed.
 *
 * `payload` is the request body as a JSON string, or null when the input isn't sendable yet. A
 * string rather than an object so identical input compares equal -- that is what keeps the
 * debounce from restarting, and the request from repeating, on a keystroke that doesn't change
 * the payload. Null never calls the endpoint.
 *
 * Both outcomes are stored against their own payload, which makes "is a request in flight?" and
 * "does this error belong to what's on screen?" comparisons rather than extra state an effect
 * would have to set synchronously.
 */
export function useLiveApiResult<TResponse>(
  path: string,
  payload: string | null,
): LiveApiResultState<TResponse> {
  const debouncedPayload = useDebouncedValue(payload, LIVE_REQUEST_DEBOUNCE_MS);

  const [outcome, setOutcome] = useState<Resolved<TResponse> | null>(null);
  const [failure, setFailure] = useState<Resolved<unknown> | null>(null);

  useEffect(() => {
    if (debouncedPayload === null) return;

    const controller = new AbortController();
    let cancelled = false;

    apiPost<unknown, TResponse>(path, JSON.parse(debouncedPayload), { signal: controller.signal })
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
  }, [path, debouncedPayload]);

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
