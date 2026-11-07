import { createDraftStorage, isObject, mergeKeyedRows } from "@/lib/draftStorage";
import { DEFAULT_NATURAL_VENTING_FORM, newFireCase, newZone } from "./defaults";
import type { FireCaseFormInput, NaturalVentingFormInput, ZoneFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else -- no database, no server copy.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:natural-venting:draft:v1";

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

  const zones: ZoneFormInput[] = mergeKeyedRows(storedZones, newZone);
  if (zones.length === 0) zones.push(...DEFAULT_NATURAL_VENTING_FORM.zones);

  const fireCases: FireCaseFormInput[] = mergeKeyedRows<FireCaseFormInput>(storedFireCases, (existing) =>
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

export const { load: loadDraft, save: saveDraft, clear: clearDraft } = createDraftStorage(DRAFT_STORAGE_KEY, mergeDraft);
