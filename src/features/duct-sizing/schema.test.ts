import { describe, expect, it } from "vitest";
import { ductSizingSchema, type DuctSizingFormInput } from "./schema";

/** Round + Equal Friction with valid values; numeric fields arrive as strings from NumberField. */
function formInput(overrides: Partial<DuctSizingFormInput> = {}): DuctSizingFormInput {
  return {
    method: "EQUAL_FRICTION",
    airFlowLps: "500",
    airTemperatureCelsius: "20",
    altitudeMeters: "0",
    ductMaterial: "GALVANIZED_STEEL_SPIRAL",
    frictionMethod: "SWAMEE_JAIN",
    shape: "ROUND",
    fixedDimensionType: "HEIGHT",
    fixedDimensionValueMm: undefined,
    targetFrictionRatePaPerM: "1.0",
    maxVelocityMps: undefined,
    ...overrides,
  };
}

function issuePaths(input: DuctSizingFormInput): string[] {
  const result = ductSizingSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("ductSizingSchema", () => {
  describe("common fields", () => {
    it("accepts a valid round, equal-friction input and coerces numbers", () => {
      const result = ductSizingSchema.parse(formInput());
      expect(result.airFlowLps).toBe(500);
      expect(result.targetFrictionRatePaPerM).toBe(1);
    });

    it("allows negative temperature and altitude (below freezing, below sea level)", () => {
      expect(issuePaths(formInput({ airTemperatureCelsius: "-10", altitudeMeters: "-50" }))).toEqual([]);
    });

    it("requires positive airflow and a selected material", () => {
      expect(issuePaths(formInput({ airFlowLps: "0", ductMaterial: "" }))).toEqual(["airFlowLps", "ductMaterial"]);
    });
  });

  describe("method (independent of shape)", () => {
    it.each([["0"], ["-1"], [undefined]])("Equal Friction requires a positive target friction rate (got %j)", (target) => {
      expect(issuePaths(formInput({ targetFrictionRatePaPerM: target }))).toEqual(["targetFrictionRatePaPerM"]);
    });

    it("Velocity requires a positive max velocity and not a friction rate", () => {
      expect(
        issuePaths(formInput({ method: "VELOCITY", targetFrictionRatePaPerM: undefined, maxVelocityMps: undefined })),
      ).toEqual(["maxVelocityMps"]);
      expect(
        issuePaths(formInput({ method: "VELOCITY", targetFrictionRatePaPerM: undefined, maxVelocityMps: "5" })),
      ).toEqual([]);
    });
  });

  describe("shape (independent of method)", () => {
    it("Round needs no fixed dimension", () => {
      expect(issuePaths(formInput({ shape: "ROUND", fixedDimensionType: undefined, fixedDimensionValueMm: undefined }))).toEqual(
        [],
      );
    });

    it("Rectangular requires a fixed dimension type and a positive value", () => {
      expect(
        issuePaths(formInput({ shape: "RECTANGULAR", fixedDimensionType: undefined, fixedDimensionValueMm: "0" })),
      ).toEqual(["fixedDimensionType", "fixedDimensionValueMm"]);
      expect(issuePaths(formInput({ shape: "RECTANGULAR", fixedDimensionValueMm: "300" }))).toEqual([]);
    });
  });

  it("checks both groups at once for Rectangular + Velocity", () => {
    expect(
      issuePaths(
        formInput({
          shape: "RECTANGULAR",
          method: "VELOCITY",
          fixedDimensionValueMm: undefined,
          targetFrictionRatePaPerM: undefined,
          maxVelocityMps: undefined,
        }),
      ),
    ).toEqual(["fixedDimensionValueMm", "maxVelocityMps"]);
  });
});
