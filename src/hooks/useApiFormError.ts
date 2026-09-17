"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api-client";

interface UseApiFormErrorResult {
  generalError: string | null;
  setGeneralError: (message: string | null) => void;
  /**
   * Call from a form's submit catch block. Field-level ApiError messages that match a known
   * form field go through react-hook-form's setError; everything else (unmatched field names,
   * or an error with no field-level detail, such as a CalculationException) becomes the inline
   * generalError banner every calculator form in this app renders the same way.
   */
  handleApiError: (err: unknown) => void;
}

/**
 * Every calculator form used to duplicate this same ~15-line submit-error-handling block
 * verbatim (13 forms, at last count). This hook is the single copy — call it right after
 * useForm() so it has access to setError, and call handleApiError(err) from the catch block
 * instead of re-deriving unmatched/fieldErrors logic per form.
 */
export function useApiFormError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  defaultValues: T,
): UseApiFormErrorResult {
  const [generalError, setGeneralError] = useState<string | null>(null);

  function handleApiError(err: unknown) {
    if (err instanceof ApiError) {
      const unmatched: string[] = [];
      if (err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          if (field in defaultValues) {
            setError(field as Path<T>, { message });
          } else {
            unmatched.push(message);
          }
        }
      }
      setGeneralError(unmatched.length > 0 ? unmatched.join(" ") : err.message);
    } else {
      setGeneralError("Something went wrong. Please try again.");
    }
  }

  return { generalError, setGeneralError, handleApiError };
}
