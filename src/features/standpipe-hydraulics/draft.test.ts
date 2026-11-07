import { describe, expect, it } from "vitest";
import { DEFAULT_STANDPIPE_FORM } from "./defaults";
import { mergeDraft } from "./draft";

describe("mergeDraft", () => {
  it("returns the defaults for anything that is not an object", () => {
    expect(mergeDraft(null)).toBe(DEFAULT_STANDPIPE_FORM);
    expect(mergeDraft("text")).toBe(DEFAULT_STANDPIPE_FORM);
  });

  it("fills in a field the draft lacks, keeping what it has", () => {
    const merged = mergeDraft({
      standpipeClass: "CLASS_II",
      segments: [{ key: "segment-4", label: "Riser", nominalSize: "3" }],
    });

    expect(merged.standpipeClass).toBe("CLASS_II");
    expect(merged.additionalStandpipes).toBe("0");
    expect(merged.segments[0].key).toBe("segment-4");
    expect(merged.segments[0].nominalSize).toBe("3");
    expect(merged.segments[0].cFactor).toBe("120");
    expect(merged.segments[0].fittings).toEqual([]);
  });

  it("gives a draft saved before fire department connections existed none, and fills a saved one in", () => {
    expect(mergeDraft({ standpipeClass: "CLASS_I" }).fireDepartmentConnections).toEqual([]);

    const merged = mergeDraft({
      fireDepartmentConnections: [
        { key: "fdc-3", label: "Street", nominalSize: "4", fittings: "not a list" },
        { key: "fdc-3", label: "Repeat" },
        { label: "No key" },
      ],
    });

    expect(merged.fireDepartmentConnections).toHaveLength(1);
    expect(merged.fireDepartmentConnections[0].key).toBe("fdc-3");
    expect(merged.fireDepartmentConnections[0].label).toBe("Street");
    expect(merged.fireDepartmentConnections[0].cFactor).toBe("120");
    expect(merged.fireDepartmentConnections[0].fittings).toEqual([]);
  });

  it("gives a draft saved before the laterals, levels, manual system and inlet size existed their defaults", () => {
    const merged = mergeDraft({ standpipeClass: "CLASS_III", additionalStandpipes: "2" });

    expect(merged.additionalStandpipes).toBe("2");
    expect(merged.singleConnectionLaterals).toBe("0");
    expect(merged.risersEndAtDifferentLevels).toBe(false);
    expect(merged.manualSystem).toBe(false);
    expect(merged.fireDepartmentConnectionInletSize).toBe("TWO_AND_HALF_INCH");
  });

  it("falls back to the starting path when the draft has no usable segment", () => {
    const merged = mergeDraft({ segments: [{ label: "No key" }] });

    expect(merged.segments).toEqual(DEFAULT_STANDPIPE_FORM.segments);
  });

  it("drops repeated keys and keeps fittings only when they are a list", () => {
    const merged = mergeDraft({
      segments: [
        { key: "segment-1", label: "A", fittings: [{ fittingType: "GATE_VALVE", quantity: "1", explicitEquivalentLengthFt: "" }] },
        { key: "segment-1", label: "B" },
        { key: "segment-2", label: "C", fittings: "nope" },
      ],
    });

    expect(merged.segments.map((segment) => segment.label)).toEqual(["A", "C"]);
    expect(merged.segments[0].fittings).toHaveLength(1);
    expect(merged.segments[1].fittings).toEqual([]);
  });
});
