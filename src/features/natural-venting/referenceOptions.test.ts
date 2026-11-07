import { describe, expect, it } from "vitest";
import {
  commodityOptions,
  commodityValue,
  dischargeOptions,
  dischargeValue,
} from "./referenceOptions";
import type { CommodityHeatReleaseEntry, DischargeCoefficientEntry } from "./types";

const DISCHARGE: DischargeCoefficientEntry[] = [
  { key: "LOUVER_90", label: "Louvered, blades at 90 degrees to the airflow", dischargeCoefficient: 0.55, clause: "Table 9.2.4.2", confidence: "verified" },
  { key: "MOST_OPENINGS_45", label: "Most vents opening at least 45 degrees", dischargeCoefficient: 0.6, clause: "A.9.2.4.2", confidence: "verified" },
];

const COMMODITIES: CommodityHeatReleaseEntry[] = [
  { key: "WOOD_PALLETS_4_88", label: "Wood pallets, stacked 4.88 m high", heatReleaseRateKwPerM2: 10200, confidence: "verified" },
  { key: "MAIL_BAGS_1_52", label: "Mail bags, filled, stored 1.52 m high", heatReleaseRateKwPerM2: 400, confidence: "verified" },
];

describe("dischargeOptions", () => {
  it("shows the coefficient and where it is printed in each label", () => {
    expect(dischargeOptions(DISCHARGE)).toEqual([
      { value: "LOUVER_90", label: "Louvered, blades at 90 degrees to the airflow: 0.55 (Table 9.2.4.2)" },
      { value: "MOST_OPENINGS_45", label: "Most vents opening at least 45 degrees: 0.6 (A.9.2.4.2)" },
    ]);
  });
});

describe("commodityOptions", () => {
  it("shows the rate with a thousands separator", () => {
    expect(commodityOptions(COMMODITIES).map((option) => option.label)).toEqual([
      "Wood pallets, stacked 4.88 m high: 10,200 kW/m²",
      "Mail bags, filled, stored 1.52 m high: 400 kW/m²",
    ]);
  });
});

describe("the picked value", () => {
  it("is the row's number as the text a form field holds", () => {
    expect(dischargeValue(DISCHARGE, "LOUVER_90")).toBe("0.55");
    expect(dischargeValue(DISCHARGE, "MOST_OPENINGS_45")).toBe("0.6");
    expect(commodityValue(COMMODITIES, "WOOD_PALLETS_4_88")).toBe("10200");
  });

  it("is undefined for a key that is not in the table, so nothing is written", () => {
    expect(dischargeValue(DISCHARGE, "NOPE")).toBeUndefined();
    expect(commodityValue(COMMODITIES, "NOPE")).toBeUndefined();
  });
});
