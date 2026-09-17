import { describe, expect, it } from "vitest";
import { powerConsumptionSchema, type PowerConsumptionFormInput } from "./schema";

/**
 * Inputs are shaped the way react-hook-form hands them to the resolver: numeric fields arrive as
 * strings from NumberField, and a blank optional field arrives as "".
 */
function formInput(overrides: Partial<PowerConsumptionFormInput> = {}): PowerConsumptionFormInput {
  return {
    mode: "DIRECT_WATTAGE",
    wattageInput: "65",
    circuitType: "",
    voltage: undefined,
    currentAmps: undefined,
    powerFactor: "",
    horsepowerInput: undefined,
    motorEfficiencyPercent: "",
    runtimeEntryMode: "simple",
    totalOperatingHours: "5",
    hoursPerDay: undefined,
    numberOfDays: undefined,
    pricePerKwh: "",
    ...overrides,
  };
}

function issuePaths(input: PowerConsumptionFormInput): string[] {
  const result = powerConsumptionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("powerConsumptionSchema", () => {
  describe("DIRECT_WATTAGE", () => {
    it("accepts a positive wattage and coerces numeric strings", () => {
      const result = powerConsumptionSchema.parse(formInput());
      expect(result.wattageInput).toBe(65);
      expect(result.totalOperatingHours).toBe(5);
    });

    it.each([["0"], ["-10"], [undefined]])("requires a positive wattage (got %j)", (wattageInput) => {
      expect(issuePaths(formInput({ wattageInput }))).toEqual(["wattageInput"]);
    });

    it("does not require the other modes' fields", () => {
      expect(issuePaths(formInput({ voltage: undefined, horsepowerInput: undefined }))).toEqual([]);
    });
  });

  describe("VOLTAGE_CURRENT", () => {
    const voltageCurrent = (overrides: Partial<PowerConsumptionFormInput> = {}) =>
      formInput({
        mode: "VOLTAGE_CURRENT",
        wattageInput: undefined,
        circuitType: "SINGLE_PHASE_AC",
        voltage: "230",
        currentAmps: "10",
        ...overrides,
      });

    it("accepts voltage and current with the power factor left blank", () => {
      const result = powerConsumptionSchema.parse(voltageCurrent());
      // Blank must mean "not provided" (backend defaults to 1.0), not 0.
      expect(result.powerFactor).toBeUndefined();
    });

    it("requires circuit type, voltage, and current", () => {
      expect(issuePaths(voltageCurrent({ circuitType: "", voltage: "0", currentAmps: undefined }))).toEqual([
        "circuitType",
        "voltage",
        "currentAmps",
      ]);
    });

    it.each([["1"], ["0.85"], ["0.01"]])("accepts power factor %s for AC", (powerFactor) => {
      expect(issuePaths(voltageCurrent({ powerFactor }))).toEqual([]);
    });

    it.each([["0"], ["-0.5"], ["1.01"]])("rejects power factor %s for AC", (powerFactor) => {
      expect(issuePaths(voltageCurrent({ powerFactor }))).toEqual(["powerFactor"]);
    });

    it("ignores the power factor for DC (the field is hidden and nulled on submit)", () => {
      expect(issuePaths(voltageCurrent({ circuitType: "DC", powerFactor: "5" }))).toEqual([]);
    });

    it("rejects an unknown circuit type", () => {
      expect(issuePaths(voltageCurrent({ circuitType: "TWO_PHASE_AC" as never }))).toContain("circuitType");
    });
  });

  describe("HORSEPOWER", () => {
    const horsepower = (overrides: Partial<PowerConsumptionFormInput> = {}) =>
      formInput({ mode: "HORSEPOWER", wattageInput: undefined, horsepowerInput: "2", ...overrides });

    it("accepts horsepower with efficiency left blank", () => {
      expect(powerConsumptionSchema.parse(horsepower()).motorEfficiencyPercent).toBeUndefined();
    });

    it("requires a positive horsepower", () => {
      expect(issuePaths(horsepower({ horsepowerInput: "0" }))).toEqual(["horsepowerInput"]);
    });

    it.each([["100"], ["85"], ["0.5"]])("accepts efficiency %s%%", (motorEfficiencyPercent) => {
      expect(issuePaths(horsepower({ motorEfficiencyPercent }))).toEqual([]);
    });

    it.each([["0"], ["100.1"], ["-5"]])("rejects efficiency %s%%", (motorEfficiencyPercent) => {
      expect(issuePaths(horsepower({ motorEfficiencyPercent }))).toEqual(["motorEfficiencyPercent"]);
    });
  });

  describe("runtime entry", () => {
    it("requires positive total hours in either runtime mode", () => {
      expect(issuePaths(formInput({ totalOperatingHours: "0" }))).toEqual(["totalOperatingHours"]);
      expect(
        issuePaths(formInput({ runtimeEntryMode: "helper", totalOperatingHours: 0, hoursPerDay: "8", numberOfDays: "30" })),
      ).toEqual(["totalOperatingHours"]);
    });

    it("requires hours/day and days only in helper mode", () => {
      expect(issuePaths(formInput({ runtimeEntryMode: "simple", hoursPerDay: "0", numberOfDays: undefined }))).toEqual([]);
      expect(
        issuePaths(formInput({ runtimeEntryMode: "helper", totalOperatingHours: 240, hoursPerDay: "0", numberOfDays: undefined })),
      ).toEqual(["hoursPerDay", "numberOfDays"]);
    });

    it("accepts a helper-mode entry whose total was computed by the form", () => {
      expect(
        issuePaths(formInput({ runtimeEntryMode: "helper", totalOperatingHours: 240, hoursPerDay: "8", numberOfDays: "30" })),
      ).toEqual([]);
    });
  });

  describe("pricePerKwh", () => {
    it("treats a blank price as not provided", () => {
      expect(powerConsumptionSchema.parse(formInput({ pricePerKwh: "" })).pricePerKwh).toBeUndefined();
    });

    it("coerces a provided price", () => {
      expect(powerConsumptionSchema.parse(formInput({ pricePerKwh: "0.15" })).pricePerKwh).toBe(0.15);
    });

    it.each([["0"], ["-1"]])("rejects a non-positive price %s", (pricePerKwh) => {
      expect(issuePaths(formInput({ pricePerKwh }))).toEqual(["pricePerKwh"]);
    });
  });
});
