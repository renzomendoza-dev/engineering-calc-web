import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import type { SprinklerFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else — no database, no server copy.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:sprinkler-hydraulics:draft:v1";

/**
 * Merges a parsed draft over the defaults, so a draft missing a field (older build, hand-edited
 * storage) still produces a complete form instead of undefined inputs. Only the lists and the
 * nested water supply need care; everything else is a flat value.
 *
 * Values are not validated here — the zod schema does that once the form holds them, which keeps
 * a half-finished draft restorable exactly as the user left it, errors and all.
 */
export function mergeDraft(raw: unknown): SprinklerFormInput {
  if (typeof raw !== "object" || raw === null) {
    return DEFAULT_SPRINKLER_FORM;
  }
  const draft = raw as Partial<SprinklerFormInput>;
  const waterSupply =
    typeof draft.waterSupply === "object" && draft.waterSupply !== null
      ? { ...DEFAULT_SPRINKLER_FORM.waterSupply, ...draft.waterSupply }
      : DEFAULT_SPRINKLER_FORM.waterSupply;

  return {
    ...DEFAULT_SPRINKLER_FORM,
    ...draft,
    waterSupply,
    sprinklers: Array.isArray(draft.sprinklers) ? draft.sprinklers : DEFAULT_SPRINKLER_FORM.sprinklers,
    segments: Array.isArray(draft.segments) ? draft.segments : DEFAULT_SPRINKLER_FORM.segments,
    deviceLosses: Array.isArray(draft.deviceLosses) ? draft.deviceLosses : DEFAULT_SPRINKLER_FORM.deviceLosses,
  };
}

/**
 * The saved draft, or null when there is none. Returns null rather than throwing when storage is
 * unavailable (private browsing, disabled site data) or holds unparseable text.
 */
export function loadDraft(): SprinklerFormInput | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    return mergeDraft(JSON.parse(stored));
  } catch {
    return null;
  }
}

/**
 * Writes the draft, ignoring failures — a full or blocked storage must not break the form.
 * Takes the already-serialized form values: the caller debounces on that string, so serializing
 * again here would just repeat the work.
 */
export function saveDraft(serializedValues: string): void {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, serializedValues);
  } catch {
    // Nothing to do: the draft is a convenience, not the source of truth.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Same as above.
  }
}
