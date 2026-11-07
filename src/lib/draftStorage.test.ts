import { afterEach, describe, expect, it, vi } from "vitest";
import { createDraftStorage, isObject, mergeKeyedRows } from "./draftStorage";

interface Row {
  key: string;
  label: string;
  items: string[];
}

const fresh = (existing: Row[]): Row => ({ key: `row-${existing.length + 1}`, label: "", items: [] });

describe("isObject", () => {
  it("is true for objects and arrays, false for null and primitives", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject("text")).toBe(false);
    expect(isObject(3)).toBe(false);
  });
});

describe("mergeKeyedRows", () => {
  it("lays each stored row over a fresh one and keeps its key", () => {
    const rows = mergeKeyedRows<Row>([{ key: "a", label: "First" }], fresh);

    expect(rows).toEqual([{ key: "a", label: "First", items: [] }]);
  });

  it("drops entries that are not objects, have no key, or repeat a key", () => {
    const rows = mergeKeyedRows<Row>(["text", null, { label: "No key" }, { key: "" }, { key: "a" }, { key: "a", label: "Again" }], fresh);

    expect(rows.map((row) => row.key)).toEqual(["a"]);
    expect(rows[0].label).toBe("");
  });

  it("gives nothing for anything that is not a list", () => {
    expect(mergeKeyedRows<Row>(undefined, fresh)).toEqual([]);
    expect(mergeKeyedRows<Row>({ key: "a" }, fresh)).toEqual([]);
  });

  it("lets the caller adjust a merged row from what was stored", () => {
    const rows = mergeKeyedRows<Row>([{ key: "a", items: "not a list" }, { key: "b", items: ["x"] }], fresh, (merged, entry) => ({
      ...merged,
      items: Array.isArray(entry.items) ? merged.items : [],
    }));

    expect(rows[0].items).toEqual([]);
    expect(rows[1].items).toEqual(["x"]);
  });
});

/** The tests run in Node, which has no window: a small in-memory stand-in for localStorage. */
function stubStorage(overrides: Partial<Storage> = {}): Map<string, string> {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    ...overrides,
  };
  vi.stubGlobal("window", { localStorage: storage });
  return values;
}

describe("createDraftStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const storage = createDraftStorage("test:draft:v1", (raw) => ({ merged: raw }));

  it("saves, loads through the merge, and clears", () => {
    stubStorage();
    expect(storage.load()).toBeNull();

    storage.save(JSON.stringify({ a: 1 }));
    expect(storage.load()).toEqual({ merged: { a: 1 } });

    storage.clear();
    expect(storage.load()).toBeNull();
  });

  it("gives null for unparseable text, and when there is no storage at all", () => {
    stubStorage().set("test:draft:v1", "{not json");
    expect(storage.load()).toBeNull();

    vi.unstubAllGlobals();
    expect(storage.load()).toBeNull();
  });

  it("swallows a full or blocked storage on save and clear", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    stubStorage({ setItem: fail, removeItem: fail });

    expect(() => storage.save("{}")).not.toThrow();
    expect(() => storage.clear()).not.toThrow();
  });
});
