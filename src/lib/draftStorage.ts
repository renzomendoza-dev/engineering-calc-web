/**
 * The pieces every wizard's saved draft shares: reading, writing and clearing one localStorage key,
 * and laying stored rows over fresh ones. Each wizard keeps its own versioned key and its own merge,
 * which knows its form's fields. Nothing is stored anywhere but the browser.
 */

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Stored rows laid over fresh ones, so a field a row lacks (an older build, hand-edited storage)
 * still has an input value. Entries that are not objects, have no key, or repeat an earlier key are
 * dropped. `finish` adjusts a merged row from what was stored, for example to keep a nested list only
 * when it really is a list.
 */
export function mergeKeyedRows<T extends { key: string }>(
  stored: unknown,
  fresh: (existing: T[]) => T,
  finish?: (merged: T, entry: Record<string, unknown>) => T,
): T[] {
  if (!Array.isArray(stored)) return [];
  const rows: T[] = [];
  for (const entry of stored) {
    if (!isObject(entry) || typeof entry.key !== "string" || entry.key === "") continue;
    if (rows.some((row) => row.key === entry.key)) continue;
    const merged = { ...fresh(rows), ...(entry as Partial<T>), key: entry.key };
    rows.push(finish ? finish(merged, entry) : merged);
  }
  return rows;
}

export interface DraftStorage<T> {
  /** The saved draft merged over the defaults, or null when there is none, or storage is unavailable or unparseable. */
  load: () => T | null;
  /**
   * Writes the already-serialized form values (the caller debounces on that string). Failures are
   * ignored: a full or blocked storage must not break the form, the draft being a convenience only.
   */
  save: (serializedValues: string) => void;
  clear: () => void;
}

/**
 * @param key   versioned storage key: bumping the version retires drafts an older build wrote,
 *              instead of merging surprises into the form
 * @param merge lays a parsed draft over the form's defaults
 */
export function createDraftStorage<T>(key: string, merge: (raw: unknown) => T): DraftStorage<T> {
  return {
    load() {
      try {
        const stored = window.localStorage.getItem(key);
        if (!stored) return null;
        return merge(JSON.parse(stored));
      } catch {
        return null;
      }
    },
    save(serializedValues) {
      try {
        window.localStorage.setItem(key, serializedValues);
      } catch {
        // The draft is a convenience, not the source of truth.
      }
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Same as above.
      }
    },
  };
}
