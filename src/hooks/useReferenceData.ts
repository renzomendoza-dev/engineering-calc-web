"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ApiError } from "@/lib/api-client";

export interface ReferenceDataState<T> {
  /** undefined until the first successful load, and whenever `key` is null. */
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
}

/**
 * Shared empty value for the named hooks to return before their data arrives. A fresh `[]` on
 * every render would give consumers a new identity each time, re-running any useMemo/useEffect
 * that depends on the list. Frozen so an accidental push can't leak between hooks.
 */
export const EMPTY_LIST: never[] = Object.freeze([]) as never[];

/**
 * Fetches reference data (dropdown options, lookup tables) from the API — the one copy of the
 * load/cancel/error logic every hook in src/hooks/ used to repeat.
 *
 * @param key  what to fetch. The fetch re-runs whenever it changes, so encode every input the
 *             loader depends on (e.g. `motor-voltages:${phaseType}:${hp}`). `null` means "not
 *             ready" — a selection the request needs is still empty — and nothing is fetched;
 *             the hook then reports no data, not loading, and no error.
 * @param load performs the request(s). Read through useEffectEvent, so it may close over the
 *             latest props without being memoized; only `key` triggers a refetch.
 * @param failureMessage shown when the request fails with something other than an ApiError
 *             (which carries its own message).
 *
 * While a new key loads, `data` still holds the previous key's result, matching how the
 * dropdowns behaved before this was extracted.
 */
export function useReferenceData<T>(
  key: string | null,
  load: () => Promise<T>,
  failureMessage: string,
): ReferenceDataState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(key !== null);
  const [error, setError] = useState<string | null>(null);
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (key === null) {
      return;
    }
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await runLoad();
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : failureMessage);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [key, failureMessage]);

  // Derived rather than reset inside the effect: once the key goes null, stale data or an error
  // from a previous selection shouldn't linger for even one extra render.
  if (key === null) {
    return { data: undefined, isLoading: false, error: null };
  }
  return { data, isLoading, error };
}
