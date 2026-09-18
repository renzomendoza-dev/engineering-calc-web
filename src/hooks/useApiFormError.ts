"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { resolveApiFormError } from "@/lib/apiFormError";

interface UseApiFormErrorResult {
  generalError: string | null;
  setGeneralError: (message: string | null) => void;
  /**
   * Call from a form's submit catch block. Field errors for fields that are part of this form
   * and currently on screen go inline (react-hook-form's setError); everything else lands in the
   * generalError banner every calculator form in this app renders the same way. See
   * resolveApiFormError for the exact rules.
   */
  handleApiError: (err: unknown) => void;
}

/**
 * Whether a field is currently mounted. Mode-specific fields (e.g. Power Consumption's
 * totalOperatingHours in "hours/day" runtime mode) stay in the form's values while hidden, so
 * `field in defaultValues` alone isn't enough: setError on an unmounted field stores the error
 * where nothing renders it, and the user never sees why the request failed.
 *
 * Checks the DOM by name — every registered input in this app spreads `name` onto a native
 * element via register(), and each page mounts at most one form at a time, so a name match is
 * this form's field.
 */
function isFieldRendered(field: string): boolean {
  return typeof document !== "undefined" && document.getElementsByName(field).length > 0;
}

/**
 * Every calculator form used to duplicate this same submit-error-handling block verbatim (13
 * forms, at last count). This hook is the single copy — call it right after useForm() so it has
 * access to setError, and call handleApiError(err) from the catch block.
 */
export function useApiFormError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  defaultValues: T,
): UseApiFormErrorResult {
  const [generalError, setGeneralError] = useState<string | null>(null);

  function handleApiError(err: unknown) {
    // A list item's path ("conductors.0.quantity") belongs to the form when its list does.
    const { inlineErrors, banner } = resolveApiFormError(
      err,
      (path) => path.split(".")[0] in defaultValues && isFieldRendered(path),
    );
    for (const [field, message] of Object.entries(inlineErrors)) {
      setError(field as Path<T>, { message });
    }
    setGeneralError(banner);
  }

  return { generalError, setGeneralError, handleApiError };
}
