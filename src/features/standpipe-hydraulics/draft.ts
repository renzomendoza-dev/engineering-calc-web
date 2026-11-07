import { DEFAULT_STANDPIPE_FORM, newFdcLine, newSegment } from "./defaults";
import type { FdcFormInput, SegmentFormInput, StandpipeFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:standpipe-hydraulics:draft:v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeSegments(stored: unknown): SegmentFormInput[] {
  if (!Array.isArray(stored)) return [];
  const rows: SegmentFormInput[] = [];
  for (const entry of stored) {
    if (!isObject(entry) || typeof entry.key !== "string" || entry.key === "") continue;
    if (rows.some((row) => row.key === entry.key)) continue;
    const merged = { ...newSegment(rows), ...(entry as Partial<SegmentFormInput>), key: entry.key };
    rows.push({ ...merged, fittings: Array.isArray(entry.fittings) ? merged.fittings : [] });
  }
  return rows;
}

function mergeConnections(stored: unknown): FdcFormInput[] {
  if (!Array.isArray(stored)) return [];
  const rows: FdcFormInput[] = [];
  for (const entry of stored) {
    if (!isObject(entry) || typeof entry.key !== "string" || entry.key === "") continue;
    if (rows.some((row) => row.key === entry.key)) continue;
    const merged = { ...newFdcLine(rows), ...(entry as Partial<FdcFormInput>), key: entry.key };
    rows.push({ ...merged, fittings: Array.isArray(entry.fittings) ? merged.fittings : [] });
  }
  return rows;
}

/**
 * Merges a parsed draft over the defaults, so a draft missing a field (an older build, hand-edited
 * storage) still produces a complete form. Values are not validated here: the schema does that once
 * the form holds them, which keeps a half-finished draft restorable exactly as it was left.
 */
export function mergeDraft(raw: unknown): StandpipeFormInput {
  if (!isObject(raw)) return DEFAULT_STANDPIPE_FORM;
  const { segments: storedSegments, fireDepartmentConnections: storedConnections, ...flat } = raw;
  const segments = mergeSegments(storedSegments);
  return {
    ...DEFAULT_STANDPIPE_FORM,
    ...(flat as Partial<StandpipeFormInput>),
    fireDepartmentConnections: mergeConnections(storedConnections),
    segments: segments.length > 0 ? segments : DEFAULT_STANDPIPE_FORM.segments,
  };
}

/** The saved draft, or null when there is none or storage is unavailable or unparseable. */
export function loadDraft(): StandpipeFormInput | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    return mergeDraft(JSON.parse(stored));
  } catch {
    return null;
  }
}

/** Writes the draft, ignoring failures: a full or blocked storage must not break the form. */
export function saveDraft(serializedValues: string): void {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, serializedValues);
  } catch {
    // The draft is a convenience, not the source of truth.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Same as above.
  }
}
