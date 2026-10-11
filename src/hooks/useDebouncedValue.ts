"use client";

import { useEffect, useState } from "react";

/**
 * The given value, but only after it has stopped changing for `delayMs`. Used to keep a keystroke
 * from firing a request: while the user is still typing, the debounced value stays behind.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
