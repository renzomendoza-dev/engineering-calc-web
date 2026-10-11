import { describe, expect, it } from "vitest";
import { hasAcImpedanceData } from "./acImpedance";
import type { ConductorImpedanceTableRow } from "./types";

function row(overrides: Partial<ConductorImpedanceTableRow> = {}): ConductorImpedanceTableRow {
  return {
    sizeLabel: "2.0",
    reactancePvcAluminumConduitOhmsPer305m: 0.058,
    reactanceSteelConduitOhmsPer305m: 0.073,
    resistanceCopperPvcOhmsPer305m: 3.1,
    resistanceCopperAluminumConduitOhmsPer305m: 3.1,
    resistanceCopperSteelOhmsPer305m: 3.1,
    // As published: PEC Table 10.1.1.9 has no aluminium-wire figures at this size.
    resistanceAluminumWirePvcOhmsPer305m: null,
    resistanceAluminumWireAluminumConduitOhmsPer305m: null,
    resistanceAluminumWireSteelOhmsPer305m: null,
    ...overrides,
  };
}

const TABLE = [
  row(),
  row({
    sizeLabel: "8.0",
    resistanceCopperPvcOhmsPer305m: 0.78,
    resistanceAluminumWirePvcOhmsPer305m: 1.28,
    resistanceAluminumWireAluminumConduitOhmsPer305m: 1.28,
    resistanceAluminumWireSteelOhmsPer305m: 1.28,
  }),
];

describe("hasAcImpedanceData", () => {
  it("accepts a size whose column is published for that conductor and conduit", () => {
    expect(hasAcImpedanceData(TABLE, "2.0", "COPPER", "PVC")).toBe(true);
    expect(hasAcImpedanceData(TABLE, "8.0", "ALUMINUM", "STEEL")).toBe(true);
  });

  it("rejects a size the table has no row for at all", () => {
    // The real gaps today: 0.75, 1.25, 600, 750, 875 and 1000 mm2.
    expect(hasAcImpedanceData(TABLE, "0.75", "COPPER", "PVC")).toBe(false);
    expect(hasAcImpedanceData(TABLE, "1000", "COPPER", "STEEL")).toBe(false);
  });

  it("rejects a row whose column for that material is blank", () => {
    expect(hasAcImpedanceData(TABLE, "2.0", "ALUMINUM", "PVC")).toBe(false);
    expect(hasAcImpedanceData(TABLE, "2.0", "ALUMINUM", "ALUMINUM")).toBe(false);
    expect(hasAcImpedanceData(TABLE, "2.0", "ALUMINUM", "STEEL")).toBe(false);
  });

  it("reads the right column for each conductor and conduit pairing", () => {
    const mixed = [
      row({
        sizeLabel: "5.5",
        resistanceCopperPvcOhmsPer305m: 1.2,
        resistanceCopperAluminumConduitOhmsPer305m: null,
        resistanceCopperSteelOhmsPer305m: 1.3,
        resistanceAluminumWirePvcOhmsPer305m: null,
        resistanceAluminumWireAluminumConduitOhmsPer305m: 2.1,
        resistanceAluminumWireSteelOhmsPer305m: null,
      }),
    ];
    expect(hasAcImpedanceData(mixed, "5.5", "COPPER", "PVC")).toBe(true);
    expect(hasAcImpedanceData(mixed, "5.5", "COPPER", "ALUMINUM")).toBe(false);
    expect(hasAcImpedanceData(mixed, "5.5", "COPPER", "STEEL")).toBe(true);
    expect(hasAcImpedanceData(mixed, "5.5", "ALUMINUM", "PVC")).toBe(false);
    expect(hasAcImpedanceData(mixed, "5.5", "ALUMINUM", "ALUMINUM")).toBe(true);
    expect(hasAcImpedanceData(mixed, "5.5", "ALUMINUM", "STEEL")).toBe(false);
  });

  it("marks nothing unavailable while the answer isn't knowable", () => {
    // No table yet (loading or failed), or a material not chosen: the form must not hide sizes
    // on a guess. The API still rejects a combination it can't resolve.
    expect(hasAcImpedanceData([], "0.75", "COPPER", "PVC")).toBe(true);
    expect(hasAcImpedanceData(TABLE, "0.75", "", "PVC")).toBe(true);
    expect(hasAcImpedanceData(TABLE, "0.75", "COPPER", "")).toBe(true);
    expect(hasAcImpedanceData(TABLE, "0.75", null, null)).toBe(true);
  });
});
