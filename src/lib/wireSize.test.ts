import { describe, expect, it } from "vitest";
import { WIRE_SIZE_TABLE, awgToMm2, nearestAwgForMm2 } from "./wireSize";

describe("awgToMm2", () => {
  it("looks up a listed size", () => {
    expect(awgToMm2("12")).toBe(3.31);
    expect(awgToMm2("4/0")).toBe(107.2);
  });

  it("returns undefined for an unlisted size", () => {
    expect(awgToMm2("18")).toBeUndefined();
    expect(awgToMm2("")).toBeUndefined();
  });
});

describe("nearestAwgForMm2", () => {
  it("returns the exact entry for a listed cross-section", () => {
    for (const entry of WIRE_SIZE_TABLE) {
      expect(nearestAwgForMm2(entry.mm2).awg).toBe(entry.awg);
    }
  });

  it("picks the closest size for a value between two sizes", () => {
    expect(nearestAwgForMm2(3.5).awg).toBe("12"); // 3.31 is closer than 5.261
    expect(nearestAwgForMm2(5).awg).toBe("10"); // 5.261 is closer than 3.31
  });

  it("clamps to the smallest and largest listed sizes", () => {
    expect(nearestAwgForMm2(0).awg).toBe("14");
    expect(nearestAwgForMm2(500).awg).toBe("4/0");
  });

  it("keeps the table ordered by increasing cross-section", () => {
    const sizes = WIRE_SIZE_TABLE.map((entry) => entry.mm2);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });
});
