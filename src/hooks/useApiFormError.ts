"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, isGenericValidationMessage } from "@/lib/api-client";

interface UseApiFormErrorResult {
  generalError: string | null;
  setGeneralError: (message: string | null) => void;
  /**
   * Call from a form's submit catch block. A field error goes inline (react-hook-form's
   * setError) when that field is part of the form AND currently on screen; everything else
   * lands in the inline generalError banner every calculator form in this app renders the
   * same way. The banner is left empty when every field error is already shown inline and the
   * error's message is only a generic "validation failed" placeholder.
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
 * "totalOperatingHours" -> "Total operating hours". The backend's field-level messages are
 * Bean Validation defaults ("must be greater than 0"), which only read as a sentence once the
 * field is named — needed whenever a field error can't be shown next to its input.
 */
function humanizeFieldName(field: string): string {
  const words = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Adds a closing period unless the message already ends a sentence, so joined messages don't run together. */
function asSentence(message: string): string {
  return /[.!?]$/.test(message.trim()) ? message.trim() : `${message.trim()}.`;
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
    if (!(err instanceof ApiError)) {
      setGeneralError("Something went wrong. Please try again.");
      return;
    }

    const bannerFieldMessages: string[] = [];
    if (err.fieldErrors) {
      for (const [field, message] of Object.entries(err.fieldErrors)) {
        if (field in defaultValues && isFieldRendered(field)) {
          setError(field as Path<T>, { message });
        } else {
          bannerFieldMessages.push(`${humanizeFieldName(field)} ${message}`);
        }
      }
    }

    const showMessage = !err.fieldErrors || !isGenericValidationMessage(err.message);
    const bannerMessages = showMessage ? [err.message, ...bannerFieldMessages] : bannerFieldMessages;
    setGeneralError(bannerMessages.length > 0 ? bannerMessages.map(asSentence).join(" ") : null);
  }

  return { generalError, setGeneralError, handleApiError };
}
