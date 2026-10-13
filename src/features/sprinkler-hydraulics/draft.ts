import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import type { SprinklerFormInput } from "./schema";

/**
 * Versioned key: a draft written by an older build may not match today's field names, and bumping
 * the version retires those drafts instead of merging surprises into the form. Nothing is stored
 * anywhere else — no database, no server copy.
 */
export const DRAFT_STORAGE_KEY = "engineering-calc:sprinkler-hydraulics:draft:v1";

/**
 * A draft that has been merged over the defaults, and whether anything in it had to be let go.
 */
export interface MergedDraft {
  values: SprinklerFormInput;
  /**
   * True when the draft held a pipe network in the previous shape -- a flat list of sprinklers and
   * pipe segments tied together by typed node ids -- which can't be carried over: an arbitrary
   * tree of hand-typed ids doesn't map reliably onto branches. Everything else is kept; the
   * network starts afresh, and the page says so rather than showing it empty without a word.
   */
  droppedLegacyNetwork: boolean;
}

/**
 * Gives every branch a key and an identical-to field. Drafts saved before a branch could be
 * declared identical have neither, and a branch needs a key that stays put to be pointed at.
 * A key that is missing, or repeats an earlier one, is replaced; an existing one is never changed.
 */
function withBranchKeys(network: SprinklerFormInput["network"]): SprinklerFormInput["network"] {
  const seen = new Set<string>();
  const branches = network.branches.map((branch, index) => {
    const stored = typeof branch.key === "string" ? branch.key.trim() : "";
    let key = stored;
    if (key === "" || seen.has(key)) {
      key = `branch-${index + 1}`;
      for (let attempt = 2; seen.has(key); attempt += 1) key = `branch-${index + 1}-${attempt}`;
    }
    seen.add(key);
    return {
      ...branch,
      key,
      identicalToKey: typeof branch.identicalToKey === "string" ? branch.identicalToKey : "",
    };
  });
  return { ...network, branches };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Whether a stored network has the shape the form's lists need: every branch holds a list of
 * sprinklers each carrying a pipe, and a cross main. Only the shape is checked -- blank or
 * half-entered values are fine -- because a draft with a list where an object belongs would break
 * the form on restore rather than merely be incomplete.
 */
function isStructuredNetwork(value: unknown): value is SprinklerFormInput["network"] {
  if (!isObject(value) || !Array.isArray(value.branches) || !Array.isArray(value.riser)) return false;
  if (value.branches.length === 0) return false;
  return (
    value.branches.every(
      (branch) =>
        isObject(branch) &&
        isObject(branch.crossMain) &&
        Array.isArray(branch.sprinklers) &&
        branch.sprinklers.every((sprinkler) => isObject(sprinkler) && isObject(sprinkler.pipe)),
    ) && value.riser.every(isObject)
  );
}

/**
 * Merges a parsed draft over the defaults, so a draft missing a field (older build, hand-edited
 * storage) still produces a complete form instead of undefined inputs. Only the lists and the
 * nested water supply need care; everything else is a flat value.
 *
 * Values are not validated here — the zod schema does that once the form holds them, which keeps
 * a half-finished draft restorable exactly as the user left it, errors and all.
 *
 * Drafts from earlier shapes are migrated where that can be done faithfully:
 * - coverage used to sit on every sprinkler; the first one's becomes the shared figure, so the
 *   calculation is what it was rather than silently the hazard's maximum;
 * - the starting pressure and the spacing between branches no longer exist and are dropped;
 * - the flat sprinklers/segments network can't be converted, and is dropped (see MergedDraft).
 */
export function mergeDraftDetailed(raw: unknown): MergedDraft {
  if (typeof raw !== "object" || raw === null) {
    return { values: DEFAULT_SPRINKLER_FORM, droppedLegacyNetwork: false };
  }
  const draft = raw as Partial<SprinklerFormInput> & Record<string, unknown>;
  const waterSupply =
    typeof draft.waterSupply === "object" && draft.waterSupply !== null
      ? { ...DEFAULT_SPRINKLER_FORM.waterSupply, ...draft.waterSupply }
      : DEFAULT_SPRINKLER_FORM.waterSupply;

  const legacyRows = Array.isArray(draft.sprinklers) ? (draft.sprinklers as unknown[]) : null;
  const structured = isStructuredNetwork(draft.network);
  const droppedLegacyNetwork =
    !structured && (legacyRows !== null || Array.isArray(draft.segments));

  const legacyCoverage =
    legacyRows !== null && typeof legacyRows[0] === "object" && legacyRows[0] !== null
      ? (legacyRows[0] as Record<string, unknown>).coverageAreaSqFt
      : undefined;
  const coveragePerSprinklerSqFt =
    draft.coveragePerSprinklerSqFt !== undefined
      ? draft.coveragePerSprinklerSqFt
      : legacyCoverage !== undefined && legacyCoverage !== "" && legacyCoverage !== 0
        ? (legacyCoverage as string | number)
        : DEFAULT_SPRINKLER_FORM.coveragePerSprinklerSqFt;

  // Fields that no longer exist are dropped rather than carried round in saved storage forever.
  const {
    assumedStartPressurePsi: _assumed,
    branchSpacingFt: _branchSpacing,
    sprinklers: _sprinklers,
    segments: _segments,
    ...kept
  } = draft;
  void _assumed;
  void _branchSpacing;
  void _sprinklers;
  void _segments;

  return {
    droppedLegacyNetwork,
    values: {
      ...DEFAULT_SPRINKLER_FORM,
      ...(kept as Partial<SprinklerFormInput>),
      coveragePerSprinklerSqFt,
      waterSupply,
      network: structured
        ? withBranchKeys(draft.network as SprinklerFormInput["network"])
        : DEFAULT_SPRINKLER_FORM.network,
      deviceLosses: Array.isArray(draft.deviceLosses) ? draft.deviceLosses : DEFAULT_SPRINKLER_FORM.deviceLosses,
      // The old default pointed at a node that no longer exists; the new one is the top of the riser.
      hoseStreamNodeId: droppedLegacyNetwork
        ? DEFAULT_SPRINKLER_FORM.hoseStreamNodeId
        : (kept.hoseStreamNodeId ?? DEFAULT_SPRINKLER_FORM.hoseStreamNodeId),
    },
  };
}

/** The merged values alone, for callers that don't care what had to be dropped. */
export function mergeDraft(raw: unknown): SprinklerFormInput {
  return mergeDraftDetailed(raw).values;
}

/**
 * The saved draft, or null when there is none. Returns null rather than throwing when storage is
 * unavailable (private browsing, disabled site data) or holds unparseable text.
 */
export function loadDraftDetailed(): MergedDraft | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    return mergeDraftDetailed(JSON.parse(stored));
  } catch {
    return null;
  }
}

/** The saved draft's values, or null when there is none. See loadDraftDetailed for what was dropped. */
export function loadDraft(): SprinklerFormInput | null {
  return loadDraftDetailed()?.values ?? null;
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
