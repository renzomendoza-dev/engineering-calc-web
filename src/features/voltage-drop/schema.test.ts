import { describe, expect, it } from "vitest";
import { voltageDropSchema, type VoltageDropFormInput } from "./schema";

/** Three-phase AC using reference tables; numeric fields arrive as strings from NumberField. */
function formInput(overrides: Partial<VoltageDropFormInput> = {}): VoltageDropFormInput {
  return {
    circuitType: "THREE_PHASE_AC",
    currentAmps: "50",
    oneWayLengthMeters: "30",
    powerFactor: "0.85",
    systemVoltage: "400",
    parallelSetsPerPhase: "1",
    useCustomImpedance: false,
    conductorSizeLabel: "14",
    conductorMaterial: "COPPER",
    conduitMaterial: "PVC",
    customResistanceOhmsPerMeter: undefined,
    customReactanceOhmsPerMeter: undefined,
    ...overrides,
  };
}

/**
 * Field paths with at least one issue, one entry per field. A field can collect several issues
 * (e.g. powerFactor 1.2 fails both `.max(1)` and the AC superRefine), but react-hook-form only
 * shows a field's first one, so that's what the form actually displays.
 */
function issuePaths(input: VoltageDropFormInput): string[] {
  const result = voltageDropSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
}

function firstMessageFor(input: VoltageDropFormInput, field: string): string | undefined {
  const result = voltageDropSchema.safeParse(input);
  return result.success ? undefined : result.error.issues.find((issue) => issue.path.join(".") === field)?.message;
}

describe("voltageDropSchema", () => {
  it("accepts a valid three-phase reference-table input", () => {
    expect(issuePaths(formInput())).toEqual([]);
  });

  describe("power factor", () => {
    it.each([["0"], [""]])("requires a power factor above 0 for AC (got %j)", (powerFactor) => {
      expect(issuePaths(formInput({ powerFactor }))).toEqual(["powerFactor"]);
    });

    it("rejects a power factor above 1 with the range message", () => {
      const input = formInput({ powerFactor: "1.2" });
      expect(issuePaths(input)).toEqual(["powerFactor"]);
      expect(firstMessageFor(input, "powerFactor")).toBe("Must be between 0 and 1");
    });

    it("does not require a power factor for DC", () => {
      expect(issuePaths(formInput({ circuitType: "DC", powerFactor: "0", conduitMaterial: "" }))).toEqual([]);
    });
  });

  it.each([["0"], ["1.5"]])("requires a whole number of parallel sets of at least 1 (got %s)", (parallelSetsPerPhase) => {
    expect(issuePaths(formInput({ parallelSetsPerPhase }))).toEqual(["parallelSetsPerPhase"]);
  });

  describe("reference-table impedance", () => {
    it("requires size, conductor material, and conduit material for AC", () => {
      expect(issuePaths(formInput({ conductorSizeLabel: "", conductorMaterial: "", conduitMaterial: "" }))).toEqual([
        "conductorSizeLabel",
        "conductorMaterial",
        "conduitMaterial",
      ]);
    });

    it("does not require conduit material for DC", () => {
      expect(issuePaths(formInput({ circuitType: "DC", conduitMaterial: "" }))).toEqual([]);
    });
  });

  describe("custom impedance", () => {
    const custom = (overrides: Partial<VoltageDropFormInput> = {}) =>
      formInput({
        useCustomImpedance: true,
        conductorSizeLabel: "",
        conductorMaterial: "",
        conduitMaterial: "",
        customResistanceOhmsPerMeter: "0.005",
        customReactanceOhmsPerMeter: "0.0001",
        ...overrides,
      });

    it("accepts custom values without any reference-table selections", () => {
      expect(issuePaths(custom())).toEqual([]);
    });

    it("requires positive resistance and non-negative reactance", () => {
      expect(issuePaths(custom({ customResistanceOhmsPerMeter: "0", customReactanceOhmsPerMeter: "-1" }))).toEqual([
        "customResistanceOhmsPerMeter",
        "customReactanceOhmsPerMeter",
      ]);
    });

    it("allows zero reactance for AC", () => {
      expect(issuePaths(custom({ customReactanceOhmsPerMeter: "0" }))).toEqual([]);
    });

    it("requires zero reactance for DC", () => {
      expect(issuePaths(custom({ circuitType: "DC", customReactanceOhmsPerMeter: "0.0001" }))).toEqual([
        "customReactanceOhmsPerMeter",
      ]);
      expect(issuePaths(custom({ circuitType: "DC", customReactanceOhmsPerMeter: "0" }))).toEqual([]);
    });
  });
});
