import { DEFAULT_NATURAL_VENTING_FORM, newFireCase, newZone } from "./defaults";
import type { FireCaseFormInput, NaturalVentingFormInput, ZoneFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else -- no database, no server copy.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:natural-venting:draft:v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A stored row laid over a fresh one, so a field the draft lacks still has an input value. */
function mergeRows<T extends { key: string; name: string }>(
  stored: unknown,
  fresh: (existing: { key: string; name: string }[]) => T,
): T[] {
  if (!Array.isArray(stored)) return [];
  const rows: T[] = [];
  for (const entry of stored) {
    if (!isObject(entry) || typeof entry.key !== "string" || entry.key === "") continue;
    if (rows.some((row) => row.key === entry.key)) continue;
    rows.push({ ...fresh(rows), ...(entry as Partial<T>), key: entry.key });
  }
  return rows;
}

/**
 * Merges a parsed draft over the defaults, so a draft missing a field (an older build, hand-edited
 * storage) still produces a complete form. Values are not validated here: the schema does that
 * once the form holds them, which keeps a half-finished draft restorable exactly as it was left.
 *
 * A draft always has at least one zone, and every fire case points at a zone that exists: one
 * that doesn't is moved to the first zone rather than left pointing at nothing.
 */
export function mergeDraft(raw: unknown): NaturalVentingFormInput {
  if (!isObject(raw)) return DEFAULT_NATURAL_VENTING_FORM;
  const { zones: storedZones, fireCases: storedFireCases, ...flat } = raw;

  const zones: ZoneFormInput[] = mergeRows(storedZones, newZone);
  if (zones.length === 0) zones.push(...DEFAULT_NATURAL_VENTING_FORM.zones);

  const fireCases: FireCaseFormInput[] = mergeRows(storedFireCases, (existing) =>
    newFireCase(existing, zones[0].key),
  ).map((fire) => (zones.some((zone) => zone.key === fire.zoneKey) ? fire : { ...fire, zoneKey: zones[0].key }));
  if (fireCases.length === 0) fireCases.push(newFireCase([], zones[0].key));

  return {
    ...DEFAULT_NATURAL_VENTING_FORM,
    ...(flat as Partial<NaturalVentingFormInput>),
    zones,
    fireCases,
  };
}

/**
 * The saved draft, or null when there is none. Returns null rather than throwing when storage is
 * unavailable (private browsing, disabled site data) or holds unparseable text.
 */
export function loadDraft(): NaturalVentingFormInput | null {
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
