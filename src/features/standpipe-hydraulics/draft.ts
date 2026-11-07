import { createDraftStorage, isObject, mergeKeyedRows } from "@/lib/draftStorage";
import { DEFAULT_STANDPIPE_FORM, newFdcLine, newSegment } from "./defaults";
import type { StandpipeFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:standpipe-hydraulics:draft:v1";

/** A row's fittings are kept only when they really are a list. */
function withFittingList<T extends { fittings: unknown[] }>(merged: T, entry: Record<string, unknown>): T {
  return { ...merged, fittings: Array.isArray(entry.fittings) ? merged.fittings : [] };
}

/**
 * Merges a parsed draft over the defaults, so a draft missing a field (an older build, hand-edited
 * storage) still produces a complete form. Values are not validated here: the schema does that once
 * the form holds them, which keeps a half-finished draft restorable exactly as it was left.
 */
export function mergeDraft(raw: unknown): StandpipeFormInput {
  if (!isObject(raw)) return DEFAULT_STANDPIPE_FORM;
  const { segments: storedSegments, fireDepartmentConnections: storedConnections, ...flat } = raw;
  const segments = mergeKeyedRows(storedSegments, newSegment, withFittingList);
  return {
    ...DEFAULT_STANDPIPE_FORM,
    ...(flat as Partial<StandpipeFormInput>),
    fireDepartmentConnections: mergeKeyedRows(storedConnections, newFdcLine, withFittingList),
    segments: segments.length > 0 ? segments : DEFAULT_STANDPIPE_FORM.segments,
  };
}

export const { load: loadDraft, save: saveDraft, clear: clearDraft } = createDraftStorage(DRAFT_STORAGE_KEY, mergeDraft);
