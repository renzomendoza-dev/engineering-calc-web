import { describe, expect, it } from "vitest";
import {
  buildPumpDemandRequest,
  buildStorageRequest,
  defaultStorageDurationMinutes,
  durationRangeFor,
  hazardClassificationFor,
  pumpAddsNoPressure,
  storageDurationIssue,
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

describe("the storage duration", () => {
  it("starts at the lowest of the hazard's range", () => {
    expect(defaultStorageDurationMinutes("LIGHT")).toBe(30);
    expect(defaultStorageDurationMinutes("ORDINARY_GROUP_1")).toBe(60);
    expect(defaultStorageDurationMinutes("ORDINARY_GROUP_2")).toBe(60);
    expect(defaultStorageDurationMinutes("EXTRA_GROUP_1")).toBe(90);
    expect(defaultStorageDurationMinutes("EXTRA_GROUP_2")).toBe(90);
  });

  it("takes the ranges of the NFPA 13 table", () => {
    expect(durationRangeFor("LIGHT")).toEqual({ minMinutes: 30, maxMinutes: 30 });
    expect(durationRangeFor("ORDINARY_GROUP_2")).toEqual({ minMinutes: 60, maxMinutes: 90 });
    expect(durationRangeFor("EXTRA_GROUP_1")).toEqual({ minMinutes: 90, maxMinutes: 120 });
  });

  it("warns when it is below the minimum, saying what the minimum is", () => {
    const issue = storageDurationIssue("45", "ORDINARY_GROUP_1");
    expect(issue?.kind).toBe("below");
    expect(issue?.message).toContain("45 min is below the 60 min");
    expect(issue?.message).toContain("Ordinary Hazard");
    expect(issue?.message).toContain("60 to 90 min");
    expect(storageDurationIssue("29", "LIGHT")?.message).toContain("a fixed 30 min");
    expect(storageDurationIssue("89", "EXTRA_GROUP_2")?.kind).toBe("below");
  });

  it("warns when it is above the top of the range", () => {
    const issue = storageDurationIssue("120", "ORDINARY_GROUP_1");
    expect(issue?.kind).toBe("above");
    expect(issue?.message).toContain("above the 90 min top");
    expect(storageDurationIssue("31", "LIGHT")?.kind).toBe("above");
  });

  it("is quiet for a figure inside the range, at either end, and for a blank or non-positive one", () => {
    expect(storageDurationIssue("60", "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue("75", "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue("90", "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue("30", "LIGHT")).toBeNull();
    expect(storageDurationIssue("", "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue(undefined, "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue("0", "ORDINARY_GROUP_1")).toBeNull();
    expect(storageDurationIssue("-5", "ORDINARY_GROUP_1")).toBeNull();
  });

  it("sends no storage request outside the range, and gives no second message for it", () => {
    for (const duration of ["45", "120"]) {
      const built = buildStorageRequest(
        inputs({ storageDurationMinutes: duration }),
        "ORDINARY_GROUP_1",
        500,
      );
      expect(built.request).toBeNull();
      expect(built.problems).toEqual([]);
    }
    expect(
      buildStorageRequest(inputs({ storageDurationMinutes: "60" }), "ORDINARY_GROUP_1", 500)
        .request,
    ).not.toBeNull();
  });
});

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
