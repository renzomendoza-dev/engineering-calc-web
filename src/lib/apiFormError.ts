import { ApiError, isGenericValidationMessage } from "@/lib/api-client";

export const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

export interface ResolvedApiFormError {
  /** Field name -> message, for errors that can be shown next to their input. */
  inlineErrors: Record<string, string>;
  /** Text for the form's general error banner, or null when there's nothing left to say. */
  banner: string | null;
}

/**
 * "totalOperatingHours" -> "Total operating hours". The backend's field-level messages are
 * Bean Validation defaults ("must be greater than 0"), which only read as a sentence once the
 * field is named — needed whenever a field error can't be shown next to its input.
 */
export function humanizeFieldName(field: string): string {
  const words = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Adds a closing period unless the message already ends a sentence, so joined messages don't run together. */
export function asSentence(message: string): string {
  const trimmed = message.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Decides where each part of a failed submit's error goes. Pure (no React, no DOM) so it can be
 * unit tested; useApiFormError supplies `canShowInline` and applies the result.
 *
 * - A field error goes inline when `canShowInline(field)` — the field is part of the form AND
 *   currently on screen. Otherwise it goes to the banner with the field named.
 * - The error's own message goes to the banner, except when it's only a generic "validation
 *   failed" placeholder accompanying field errors (those already say everything).
 */
export function resolveApiFormError(
  err: unknown,
  canShowInline: (field: string) => boolean,
): ResolvedApiFormError {
  if (!(err instanceof ApiError)) {
    return { inlineErrors: {}, banner: UNEXPECTED_ERROR_MESSAGE };
  }

  const inlineErrors: Record<string, string> = {};
  const bannerFieldMessages: string[] = [];
  for (const [field, message] of Object.entries(err.fieldErrors ?? {})) {
    if (canShowInline(field)) {
      inlineErrors[field] = message;
    } else {
      bannerFieldMessages.push(`${humanizeFieldName(field)} ${message}`);
    }
  }

  const showMessage = !err.fieldErrors || !isGenericValidationMessage(err.message);
  const bannerMessages = showMessage ? [err.message, ...bannerFieldMessages] : bannerFieldMessages;

  return {
    inlineErrors,
    banner: bannerMessages.length > 0 ? bannerMessages.map(asSentence).join(" ") : null,
  };
}
