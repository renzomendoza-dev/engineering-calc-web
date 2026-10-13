import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import {
  DRAFT_STORAGE_KEY,
  clearDraft,
  loadDraft,
  loadDraftDetailed,
  mergeDraft,
  mergeDraftDetailed,
  saveDraft,
} from "./draft";

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
    expect(merged.network).toEqual(DEFAULT_SPRINKLER_FORM.network);
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
    const merged = mergeDraft({ network: { branches: "not a list", riser: [] }, deviceLosses: null, waterSupply: 7 });
    expect(merged.network).toEqual(DEFAULT_SPRINKLER_FORM.network);
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
    const network = {
      branches: [
        {
          key: "branch-1",
          identicalToKey: "",
          sprinklers: [{ kFactor: "", pipe: { ...DEFAULT_SPRINKLER_FORM.network.branches[0].crossMain, pipeLengthFt: "" } }],
          crossMain: DEFAULT_SPRINKLER_FORM.network.branches[0].crossMain,
        },
      ],
      riser: [],
    };
    const merged = mergeDraft({ designAreaSqFt: "", network });
    expect(merged.designAreaSqFt).toBe("");
    expect(merged.network).toEqual(network);
  });

  it("keeps a branch-by-branch network exactly as saved, riser and all", () => {
    const run = DEFAULT_SPRINKLER_FORM.network.branches[0].crossMain;
    const network = {
      branches: [
        {
          key: "first",
          identicalToKey: "",
          sprinklers: [{ kFactor: 5.6, pipe: run }, { kFactor: 5.6, pipe: run }],
          crossMain: run,
        },
        { key: "second", identicalToKey: "first", sprinklers: [{ kFactor: 5.6, pipe: run }], crossMain: run },
      ],
      riser: [run, run],
    };
    const result = mergeDraftDetailed({ network, hoseStreamNodeId: "R2" });
    expect(result.values.network).toEqual(network);
    expect(result.values.hoseStreamNodeId).toBe("R2");
    expect(result.droppedLegacyNetwork).toBe(false);
  });

  describe("branch keys, which an identical branch points at", () => {
    const run = DEFAULT_SPRINKLER_FORM.network.branches[0].crossMain;
    const unkeyed = () => ({ sprinklers: [{ kFactor: 5.6, pipe: run }], crossMain: run });

    it("gives a draft saved before keys existed one key per branch, and no identical-to", () => {
      const { values } = mergeDraftDetailed({ network: { branches: [unkeyed(), unkeyed()], riser: [] } });
      const [first, second] = values.network.branches;

      expect(first.key).not.toBe("");
      expect(second.key).not.toBe("");
      expect(first.key).not.toBe(second.key);
      expect(first.identicalToKey).toBe("");
      expect(second.identicalToKey).toBe("");
    });

    it("never changes a key the draft already had", () => {
      const network = {
        branches: [
          { ...unkeyed(), key: "kept-a", identicalToKey: "" },
          { ...unkeyed(), key: "kept-b", identicalToKey: "kept-a" },
        ],
        riser: [],
      };
      const { values } = mergeDraftDetailed({ network });

      expect(values.network.branches.map((b) => b.key)).toEqual(["kept-a", "kept-b"]);
      expect(values.network.branches[1].identicalToKey).toBe("kept-a");
    });

    it("replaces a repeated key, so two branches can never be confused for one", () => {
      const network = {
        branches: [
          { ...unkeyed(), key: "same", identicalToKey: "" },
          { ...unkeyed(), key: "same", identicalToKey: "" },
        ],
        riser: [],
      };
      const keys = mergeDraftDetailed({ network }).values.network.branches.map((b) => b.key);

      expect(new Set(keys).size).toBe(2);
      expect(keys[0]).toBe("same");
    });
  });

  it("does not trust a network whose branches are the wrong shape", () => {
    // A branch without a pipe on its sprinkler would break the form on restore, not just be blank.
    const broken = { branches: [{ sprinklers: [{ kFactor: 5.6 }], crossMain: {} }], riser: [] };
    expect(mergeDraft({ network: broken }).network).toEqual(DEFAULT_SPRINKLER_FORM.network);
  });
});

/**
 * Drafts from before the network was entered branch by branch hold a flat list of sprinklers and
 * of pipe segments joined by typed node ids. Those can't be mapped onto branches, so they are
 * dropped -- and the page is told, so an empty network is explained rather than mysterious.
 */
describe("mergeDraftDetailed: a draft with the previous flat network", () => {
  const flat = {
    projectName: "Saved last month",
    designAreaSqFt: "1500",
    sprinklers: [{ nodeId: "S1", kFactor: "5.6" }],
    segments: [{ fromNodeId: "S1", toNodeId: "RISER", nominalSize: "1" }],
    hoseStreamNodeId: "RISER",
  };

  it("starts the network afresh and says that it did", () => {
    const result = mergeDraftDetailed(flat);
    expect(result.droppedLegacyNetwork).toBe(true);
    expect(result.values.network).toEqual(DEFAULT_SPRINKLER_FORM.network);
  });

  it("keeps everything that is not the network", () => {
    const { values } = mergeDraftDetailed(flat);
    expect(values.projectName).toBe("Saved last month");
    expect(values.designAreaSqFt).toBe("1500");
  });

  it("points the hose stream back at the top of the riser, since the old node is gone", () => {
    expect(mergeDraftDetailed(flat).values.hoseStreamNodeId).toBe("TOR");
  });

  it("carries no trace of the old lists into the form", () => {
    const values = mergeDraftDetailed(flat).values as unknown as Record<string, unknown>;
    expect(values).not.toHaveProperty("sprinklers");
    expect(values).not.toHaveProperty("segments");
  });

  it("does not claim to have dropped anything from a draft that never had a network", () => {
    expect(mergeDraftDetailed({ projectName: "Fresh" }).droppedLegacyNetwork).toBe(false);
    expect(mergeDraftDetailed(null).droppedLegacyNetwork).toBe(false);
  });

  it("loads through storage with the flag, so the page can show the notice", () => {
    installStorage();
    saveDraft(JSON.stringify(flat));
    expect(loadDraftDetailed()?.droppedLegacyNetwork).toBe(true);
    expect(loadDraft()?.network).toEqual(DEFAULT_SPRINKLER_FORM.network);
  });
});

/**
 * Drafts saved before coverage became one project-level figure carried it on every sprinkler, and
 * asked for a starting pressure and a spacing between branches. They have to keep loading, and
 * keep calculating the same thing.
 */
describe("mergeDraft: drafts saved before the design basis moved to step 1", () => {
  const legacy = {
    projectName: "Saved last week",
    hazard: "ORDINARY_GROUP_1",
    assumedStartPressurePsi: "7",
    branchSpacingFt: "10",
    sprinklers: [
      { nodeId: "S1", kFactor: "5.6", coverageAreaSqFt: "130" },
      { nodeId: "S2", kFactor: "5.6", coverageAreaSqFt: "130" },
    ],
  };

  it("takes the shared coverage from the first sprinkler, so the calculation is unchanged", () => {
    expect(mergeDraft(legacy).coveragePerSprinklerSqFt).toBe("130");
  });

  it("leaves a draft that already has the shared coverage alone", () => {
    const merged = mergeDraft({ ...legacy, coveragePerSprinklerSqFt: "150" });
    expect(merged.coveragePerSprinklerSqFt).toBe("150");
  });

  it("falls back to the default when the old rows had no usable coverage", () => {
    for (const coverageAreaSqFt of ["", 0, undefined]) {
      const merged = mergeDraft({ sprinklers: [{ nodeId: "S1", kFactor: "5.6", coverageAreaSqFt }] });
      expect(merged.coveragePerSprinklerSqFt).toBe(DEFAULT_SPRINKLER_FORM.coveragePerSprinklerSqFt);
    }
  });

  it("lets go of the per-row coverage along with the rows themselves", () => {
    const merged = mergeDraft(legacy) as unknown as Record<string, unknown>;
    expect(merged).not.toHaveProperty("sprinklers");
  });

  it("drops the starting pressure and the branch spacing, which no longer exist", () => {
    const merged = mergeDraft(legacy) as unknown as Record<string, unknown>;
    expect(merged).not.toHaveProperty("assumedStartPressurePsi");
    expect(merged).not.toHaveProperty("branchSpacingFt");
  });

  it("keeps everything else the draft had", () => {
    const merged = mergeDraft(legacy);
    expect(merged.projectName).toBe("Saved last week");
    expect(merged.hazard).toBe("ORDINARY_GROUP_1");
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
