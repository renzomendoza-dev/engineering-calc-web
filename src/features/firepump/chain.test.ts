import { describe, expect, it } from "vitest";
import {
  buildPumpCapacityRequest,
  buildPumpDemandRequest,
  pumpAddsNoPressure,
  toNumberOrNull,
  type PumpChainInputs,
} from "./chain";

function inputs(overrides: Partial<PumpChainInputs> = {}): PumpChainInputs {
  return {
    suctionCondition: "FLOODED",
    suctionPressurePsi: "20",
    suctionLiftFt: "",
    pumpSafetyMarginPercent: "",
    ...overrides,
  };
}

describe("toNumberOrNull", () => {
  it("reads a number, and returns null for blank or not a number", () => {
    expect(toNumberOrNull("12.5")).toBe(12.5);
    expect(toNumberOrNull(" 0 ")).toBe(0);
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("  ")).toBeNull();
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
  });
});

describe("buildPumpDemandRequest", () => {
  it("hands the demand flow and the required pressure to the pump demand calculator", () => {
    const built = buildPumpDemandRequest(inputs(), 750, 129.5);

    expect(built.problems).toEqual([]);
    expect(built.request).toEqual({
      requiredFlowGpm: 750,
      requiredPressurePsiAtDemandPoint: 129.5,
      suctionCondition: "FLOODED",
      availableSuctionPressurePsi: 20,
      suctionLiftFeet: null,
      safetyMarginPercent: 0,
    });
  });

  it("sends the lift, and no suction pressure, for a suction lift", () => {
    const built = buildPumpDemandRequest(inputs({ suctionCondition: "LIFT", suctionLiftFt: "8", pumpSafetyMarginPercent: "10" }), 500, 100);

    expect(built.request).toMatchObject({
      suctionCondition: "LIFT",
      availableSuctionPressurePsi: null,
      suctionLiftFeet: 8,
      safetyMarginPercent: 10,
    });
  });

  it("says what is missing instead of sending", () => {
    expect(buildPumpDemandRequest(inputs({ suctionPressurePsi: "" }), 500, 100).problems).toHaveLength(1);
    expect(buildPumpDemandRequest(inputs({ suctionCondition: "LIFT", suctionLiftFt: "" }), 500, 100).problems).toHaveLength(1);
    expect(buildPumpDemandRequest(inputs({ suctionCondition: "LIFT", suctionLiftFt: "-3" }), 500, 100).problems).toHaveLength(1);
    expect(buildPumpDemandRequest(inputs({ pumpSafetyMarginPercent: "-5" }), 500, 100).problems).toHaveLength(1);
    expect(buildPumpDemandRequest(inputs({ suctionPressurePsi: "" }), 500, 100).request).toBeNull();
  });
});

describe("pumpAddsNoPressure", () => {
  it("is true only for a flooded suction already at or above the required pressure", () => {
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "130" }), 129.5)).toBe(true);
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "129.5" }), 129.5)).toBe(true);
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "20" }), 129.5)).toBe(false);
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "" }), 129.5)).toBe(false);
    expect(pumpAddsNoPressure(inputs({ suctionCondition: "LIFT", suctionPressurePsi: "500" }), 129.5)).toBe(false);
  });
});

describe("buildPumpCapacityRequest", () => {
  it("passes the rated flow on", () => {
    expect(buildPumpCapacityRequest(850)).toEqual({ ratedFlowGpm: 850 });
  });
});
