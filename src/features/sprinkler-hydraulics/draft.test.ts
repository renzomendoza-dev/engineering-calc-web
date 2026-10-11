import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import { DRAFT_STORAGE_KEY, clearDraft, loadDraft, mergeDraft, saveDraft } from "./draft";

/**
 * A minimal localStorage. The Vitest environment is "node" (no DOM), so `window` is installed for
 * the duration of each test — the same thing the browser gives these functions.
 */
function installStorage(overrides: Partial<Storage> = {}) {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    ...overrides,
  } as Storage;
  vi.stubGlobal("window", { localStorage: storage });
  return { entries, storage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mergeDraft", () => {
  it("keeps the draft's values", () => {
    const merged = mergeDraft({ ...DEFAULT_SPRINKLER_FORM, projectName: "Warehouse A", hazard: "EXTRA_GROUP_1" });
    expect(merged.projectName).toBe("Warehouse A");
    expect(merged.hazard).toBe("EXTRA_GROUP_1");
  });

  it("fills in fields a draft from an older build is missing", () => {
    const merged = mergeDraft({ projectName: "Partial" });
    expect(merged.projectName).toBe("Partial");
    expect(merged.systemType).toBe(DEFAULT_SPRINKLER_FORM.systemType);
    expect(merged.waterSupply).toEqual(DEFAULT_SPRINKLER_FORM.waterSupply);
    expect(merged.segments).toEqual(DEFAULT_SPRINKLER_FORM.segments);
  });

  it("merges a partial water supply rather than losing the rest of it", () => {
    const merged = mergeDraft({ waterSupply: { staticPressurePsi: "95" } });
    expect(merged.waterSupply).toEqual({
      staticPressurePsi: "95",
      residualPressurePsi: DEFAULT_SPRINKLER_FORM.waterSupply.residualPressurePsi,
      flowAtResidualGpm: DEFAULT_SPRINKLER_FORM.waterSupply.flowAtResidualGpm,
    });
  });

  it("replaces a non-list where a list belongs, instead of handing the form a bad value", () => {
    const merged = mergeDraft({ sprinklers: "not a list", deviceLosses: null, waterSupply: 7 });
    expect(merged.sprinklers).toEqual(DEFAULT_SPRINKLER_FORM.sprinklers);
    expect(merged.deviceLosses).toEqual(DEFAULT_SPRINKLER_FORM.deviceLosses);
    expect(merged.waterSupply).toEqual(DEFAULT_SPRINKLER_FORM.waterSupply);
  });

  it("keeps an empty device list, which is a legitimate choice", () => {
    expect(mergeDraft({ deviceLosses: [] }).deviceLosses).toEqual([]);
  });

  it("falls back to the defaults for anything that isn't an object", () => {
    expect(mergeDraft(null)).toEqual(DEFAULT_SPRINKLER_FORM);
    expect(mergeDraft("draft")).toEqual(DEFAULT_SPRINKLER_FORM);
    expect(mergeDraft(42)).toEqual(DEFAULT_SPRINKLER_FORM);
  });

  it("does not keep an incomplete draft from being restored — values are validated by the form", () => {
    // A half-filled draft is restorable as-is; it's the schema's job to flag the gaps.
    const merged = mergeDraft({ designAreaSqFt: "", sprinklers: [{ nodeId: "", kFactor: "", coverageAreaSqFt: "" }] });
    expect(merged.designAreaSqFt).toBe("");
    expect(merged.sprinklers).toEqual([{ nodeId: "", kFactor: "", coverageAreaSqFt: "" }]);
  });
});

describe("saveDraft / loadDraft / clearDraft", () => {
  beforeEach(() => {
    installStorage();
  });

  it("round-trips the form values under a versioned key", () => {
    const values = { ...DEFAULT_SPRINKLER_FORM, projectName: "Warehouse A" };
    saveDraft(JSON.stringify(values));
    expect(loadDraft()).toEqual(values);
    expect(DRAFT_STORAGE_KEY).toContain(":v1");
  });

  it("returns null when nothing has been saved", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns null rather than throwing on unparseable stored text", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, "{not json");
    expect(loadDraft()).toBeNull();
  });

  it("forgets the draft when cleared", () => {
    saveDraft(JSON.stringify(DEFAULT_SPRINKLER_FORM));
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});

describe("storage failures", () => {
  it("loads as 'no draft' when reading throws (private browsing, blocked site data)", () => {
    installStorage({
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(loadDraft()).toBeNull();
  });

  it("ignores a failed write instead of breaking the form", () => {
    installStorage({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => saveDraft(JSON.stringify(DEFAULT_SPRINKLER_FORM))).not.toThrow();
  });

  it("ignores a failed clear", () => {
    installStorage({
      removeItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(() => clearDraft()).not.toThrow();
  });

  it("loads as 'no draft' when there is no window at all", () => {
    vi.stubGlobal("window", undefined);
    expect(loadDraft()).toBeNull();
  });
});
