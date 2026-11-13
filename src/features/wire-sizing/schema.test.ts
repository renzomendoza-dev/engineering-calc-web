import { describe, expect, it } from "vitest";
import { wireSizingSchema, type WireSizingFormInput } from "./schema";

function validForm(): WireSizingFormInput {
  return {
    loadCurrentAmps: 20,
    isContinuousLoad: false,
    ambientTempCelsius: 30,
    numberOfCurrentCarryingConductors: 3,
    numberOfParallelSets: 1,
    insulationType: "THHN",
    conductorMaterial: "COPPER",
    terminationTempRatingCelsius: 75,
    overcurrentDeviceAmps: "",
    nipple: false,
    multipleReceptacleBranchCircuit: false,
    includeVoltageDropCheck: false,
    voltageDropCheck: {},
  };
}

function issuePaths(input: WireSizingFormInput): string[] {
  const result = wireSizingSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("wireSizingSchema overcurrent device", () => {
  it("reads a blank overcurrent device as not given, not as zero", () => {
    const result = wireSizingSchema.safeParse(validForm());

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.overcurrentDeviceAmps).toBeUndefined();
  });

  it("takes a positive rating", () => {
    const result = wireSizingSchema.safeParse({ ...validForm(), overcurrentDeviceAmps: "20" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.overcurrentDeviceAmps).toBe(20);
  });

  it("rejects zero, a negative rating and text", () => {
    for (const value of ["0", "-20", "abc"]) {
      expect(issuePaths({ ...validForm(), overcurrentDeviceAmps: value })).toContain("overcurrentDeviceAmps");
    }
  });
});

describe("wireSizingSchema multi-receptacle branch circuit", () => {
  it("takes the flag either way", () => {
    const yes = wireSizingSchema.safeParse({ ...validForm(), multipleReceptacleBranchCircuit: true });

    expect(yes.success && yes.data.multipleReceptacleBranchCircuit).toBe(true);
    expect(issuePaths({ ...validForm(), multipleReceptacleBranchCircuit: "no" as unknown as boolean })).toContain(
      "multipleReceptacleBranchCircuit",
    );
  });
});

describe("wireSizingSchema nipple", () => {
  it("takes a nipple or a run", () => {
    const run = wireSizingSchema.safeParse(validForm());
    const nipple = wireSizingSchema.safeParse({ ...validForm(), nipple: true });

    expect(run.success && run.data.nipple).toBe(false);
    expect(nipple.success && nipple.data.nipple).toBe(true);
  });

  it("rejects a nipple that is not a boolean", () => {
    expect(issuePaths({ ...validForm(), nipple: "yes" as unknown as boolean })).toContain("nipple");
  });
});
