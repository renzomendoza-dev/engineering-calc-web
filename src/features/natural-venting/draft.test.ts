import { describe, expect, it } from "vitest";
import { DEFAULT_NATURAL_VENTING_FORM } from "./defaults";
import { mergeDraft } from "./draft";

describe("mergeDraft", () => {
  it("returns the defaults for anything that is not an object", () => {
    expect(mergeDraft(null)).toBe(DEFAULT_NATURAL_VENTING_FORM);
    expect(mergeDraft("text")).toBe(DEFAULT_NATURAL_VENTING_FORM);
  });

  it("fills in a field the draft lacks, keeping what it has", () => {
    const merged = mergeDraft({
      ambientTemperature: "35",
      zones: [{ key: "zone-3", name: "Hall", ceilingHeight: "12" }],
      fireCases: [{ key: "fire-1", name: "A", zoneKey: "zone-3" }],
    });

    expect(merged.ambientTemperature).toBe("35");
    expect(merged.zones[0].key).toBe("zone-3");
    expect(merged.zones[0].ceilingHeight).toBe("12");
    expect(merged.zones[0].inletMode).toBe("ratio");
    expect(merged.fireCases[0].kind).toBe("STEADY");
  });

  it("always has a zone and a fire case, and no fire case points at a missing zone", () => {
    const empty = mergeDraft({ zones: [], fireCases: [] });
    expect(empty.zones).toHaveLength(1);
    expect(empty.fireCases).toHaveLength(1);

    const lost = mergeDraft({
      zones: [{ key: "zone-1", name: "Hall" }],
      fireCases: [{ key: "fire-1", name: "A", zoneKey: "zone-7" }],
    });
    expect(lost.fireCases[0].zoneKey).toBe("zone-1");
  });

  it("drops rows without a usable key and repeated keys", () => {
    const merged = mergeDraft({
      zones: [{ name: "No key" }, { key: "zone-1", name: "A" }, { key: "zone-1", name: "B" }],
    });

    expect(merged.zones.map((zone) => zone.name)).toEqual(["A"]);
  });
});
