import { describe, expect, it } from "vitest";
import {
  buildPumpDemandRequest,
  buildStorageRequest,
  hazardClassificationFor,
  pumpAddsNoPressure,
  toNumberOrNull,
  type PumpStorageInputs,
} from "./pumpStorage";

function inputs(overrides: Partial<PumpStorageInputs> = {}): PumpStorageInputs {
  return {
    suctionCondition: "FLOODED",
    suctionPressurePsi: "20",
    suctionLiftFt: "",
    pumpSafetyMarginPercent: "",
    storageDurationMinutes: "",
    storageSafetyMarginPercent: "",
    ...overrides,
  };
}

describe("hazardClassificationFor", () => {
  it("maps the five hazards onto the storage calculator's three classes", () => {
    expect(hazardClassificationFor("LIGHT")).toBe("LIGHT_HAZARD");
    expect(hazardClassificationFor("ORDINARY_GROUP_1")).toBe("ORDINARY_HAZARD");
    expect(hazardClassificationFor("ORDINARY_GROUP_2")).toBe("ORDINARY_HAZARD");
    expect(hazardClassificationFor("EXTRA_GROUP_1")).toBe("EXTRA_HAZARD");
    expect(hazardClassificationFor("EXTRA_GROUP_2")).toBe("EXTRA_HAZARD");
  });
});

describe("toNumberOrNull", () => {
  it("reads blanks and non-numbers as null, and numbers as numbers", () => {
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("  ")).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull("12.5")).toBe(12.5);
    expect(toNumberOrNull(0)).toBe(0);
  });
});

describe("buildPumpDemandRequest", () => {
  it("passes the sprinkler demand and pressure straight through, with a flooded suction", () => {
    const { request } = buildPumpDemandRequest(inputs(), 478.2, 77.2);

    expect(request).toEqual({
      requiredFlowGpm: 478.2,
      requiredPressurePsiAtDemandPoint: 77.2,
      suctionCondition: "FLOODED",
      availableSuctionPressurePsi: 20,
      suctionLiftFeet: null,
      safetyMarginPercent: 0,
    });
  });

  it("sends only the lift for a lift suction, and a margin when given", () => {
    const { request } = buildPumpDemandRequest(
      inputs({ suctionCondition: "LIFT", suctionLiftFt: "8", pumpSafetyMarginPercent: "10" }),
      300,
      90,
    );

    expect(request).toMatchObject({
      suctionCondition: "LIFT",
      availableSuctionPressurePsi: null,
      suctionLiftFeet: 8,
      safetyMarginPercent: 10,
    });
  });

  it("accepts zero available suction pressure, which is a statement and not a blank", () => {
    expect(
      buildPumpDemandRequest(inputs({ suctionPressurePsi: "0" }), 300, 90).request,
    ).not.toBeNull();
  });

  it("says what is missing instead of sending a request the API would refuse", () => {
    expect(buildPumpDemandRequest(inputs({ suctionPressurePsi: "" }), 300, 90).problems).toEqual([
      "Enter the pressure available at the pump suction (0 if there is none).",
    ]);
    expect(
      buildPumpDemandRequest(inputs({ suctionCondition: "LIFT", suctionLiftFt: "" }), 300, 90)
        .problems,
    ).toEqual(["Enter the suction lift."]);
    expect(
      buildPumpDemandRequest(inputs({ pumpSafetyMarginPercent: "-5" }), 300, 90).request,
    ).toBeNull();
  });
});

describe("buildStorageRequest", () => {
  it("sizes for the standard pump rating, classed by the sprinkler hazard", () => {
    const { request } = buildStorageRequest(inputs(), "ORDINARY_GROUP_2", 500);

    expect(request).toEqual({
      ratedPumpFlowGpm: 500,
      hazardClassification: "ORDINARY_HAZARD",
      selectedDurationMinutes: null,
      safetyMarginPercent: 0,
    });
  });

  it("sends a stated duration, and null for a blank one so the API takes the top of the range", () => {
    expect(
      buildStorageRequest(inputs({ storageDurationMinutes: "60" }), "ORDINARY_GROUP_1", 500).request
        ?.selectedDurationMinutes,
    ).toBe(60);
    expect(
      buildStorageRequest(inputs({ storageDurationMinutes: "" }), "ORDINARY_GROUP_1", 500).request
        ?.selectedDurationMinutes,
    ).toBeNull();
  });

  it("refuses a non-positive duration and a negative margin", () => {
    expect(
      buildStorageRequest(inputs({ storageDurationMinutes: "0" }), "LIGHT", 500).request,
    ).toBeNull();
    expect(
      buildStorageRequest(inputs({ storageSafetyMarginPercent: "-1" }), "LIGHT", 500).request,
    ).toBeNull();
  });
});

describe("pumpAddsNoPressure", () => {
  it("is true when the suction already delivers what the system needs", () => {
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "50" }), 26.8)).toBe(true);
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "26.8" }), 26.8)).toBe(true);
  });

  it("is false when the supply falls short, when there is no figure yet, and for a lift", () => {
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "20" }), 26.8)).toBe(false);
    expect(pumpAddsNoPressure(inputs({ suctionPressurePsi: "" }), 26.8)).toBe(false);
    expect(
      pumpAddsNoPressure(inputs({ suctionCondition: "LIFT", suctionPressurePsi: "99" }), 26.8),
    ).toBe(false);
  });
});
