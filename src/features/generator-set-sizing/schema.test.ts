import { describe, expect, it } from "vitest";
import { buildGeneratorSetRequest } from "./request";
import { generatorSetSchema, type GeneratorSetFormInput } from "./schema";

/**
 * Inputs are shaped the way react-hook-form hands them to the resolver: numeric fields arrive as
 * strings from NumberField, and a blank optional field arrives as "".
 */
function formInput(overrides: Partial<GeneratorSetFormInput> = {}): GeneratorSetFormInput {
  return {
    standbyClass: "EMERGENCY",
    optionalTransfer: "",
    phaseType: "THREE_PHASE",
    voltage: "400",
    lightingAreas: [
      {
        label: "Ground floor",
        occupancy: "OFFICE_BUILDINGS",
        areaType: "GENERAL",
        floorAreaM2: "1000",
        unitLoadVoltAmperesPerM2: "",
        entireLightingUsedAtOnce: false,
        continuous: true,
      },
    ],
    receptacleGroups: [],
    applyReceptacleDemandFactor: true,
    otherLoads: [],
    motors: [],
    generatorPowerFactor: "0.8",
    spareCapacityPercent: "0",
    selectedGeneratorKva: "",
    designPreventsOverload: false,
    sizeOutputConductor: false,
    outputConductor: {
      ambientTempCelsius: "30",
      numberOfCurrentCarryingConductors: "3",
      numberOfParallelSets: "1",
      insulationType: "",
      conductorMaterial: "",
      terminationTempRatingCelsius: "",
    },
    ...overrides,
  };
}

function issuePaths(input: GeneratorSetFormInput): string[] {
  const result = generatorSetSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("generatorSetSchema", () => {
  it("accepts a lighting-only emergency system and coerces numeric strings", () => {
    const result = generatorSetSchema.parse(formInput());
    expect(result.voltage).toBe(400);
    expect(result.lightingAreas[0].floorAreaM2).toBe(1000);
    expect(result.selectedGeneratorKva).toBeUndefined();
  });

  it("requires at least one load, reported against the first list", () => {
    expect(issuePaths(formInput({ lightingAreas: [] }))).toEqual(["lightingAreas"]);
  });

  it("requires a transfer mode for optional standby only", () => {
    expect(issuePaths(formInput({ standbyClass: "OPTIONAL" }))).toEqual(["optionalTransfer"]);
    expect(issuePaths(formInput({ standbyClass: "OPTIONAL", optionalTransfer: "MANUAL" }))).toEqual([]);
  });

  it("requires a standby class and a voltage", () => {
    expect(issuePaths(formInput({ standbyClass: "", voltage: "" }))).toEqual([
      "standbyClass",
      "voltage",
    ]);
  });

  it.each([["0"], ["-5"], [""]])("requires a positive floor area (got %j)", (floorAreaM2) => {
    const area = formInput().lightingAreas[0];
    expect(issuePaths(formInput({ lightingAreas: [{ ...area, floorAreaM2 }] }))).toEqual([
      "lightingAreas.0.floorAreaM2",
    ]);
  });

  it("keeps a blank design unit load as not entered rather than zero", () => {
    const result = generatorSetSchema.parse(formInput());
    expect(result.lightingAreas[0].unitLoadVoltAmperesPerM2).toBeUndefined();
  });

  it("limits an other load's demand factor to 100%", () => {
    const load = { label: "Pump room", voltAmperes: "5000", demandFactorPercent: "120", continuous: false };
    expect(issuePaths(formInput({ otherLoads: [load] }))).toEqual(["otherLoads.0.demandFactorPercent"]);
  });

  it("asks for the motor's horsepower and voltage", () => {
    const motor = { label: "", horsepowerLabel: "", voltage: "", quantity: "1" };
    expect(issuePaths(formInput({ motors: [motor] }))).toEqual([
      "motors.0.horsepowerLabel",
      "motors.0.voltage",
    ]);
  });

  it("requires the conductor conditions only when the output conductors are to be sized", () => {
    expect(issuePaths(formInput({ sizeOutputConductor: false }))).toEqual([]);
    expect(issuePaths(formInput({ sizeOutputConductor: true }))).toEqual([
      "outputConductor.insulationType",
      "outputConductor.conductorMaterial",
      "outputConductor.terminationTempRatingCelsius",
    ]);
  });
});

describe("buildGeneratorSetRequest", () => {
  it("sends a transfer mode only for optional standby", () => {
    const emergency = buildGeneratorSetRequest(
      generatorSetSchema.parse(formInput({ optionalTransfer: "MANUAL" })),
    );
    const optional = buildGeneratorSetRequest(
      generatorSetSchema.parse(formInput({ standbyClass: "OPTIONAL", optionalTransfer: "MANUAL" })),
    );
    expect(emergency.optionalTransfer).toBeNull();
    expect(optional.optionalTransfer).toBe("MANUAL");
  });

  it("sends blank optional numbers as null and trims names", () => {
    const area = formInput().lightingAreas[0];
    const request = buildGeneratorSetRequest(
      generatorSetSchema.parse(formInput({ lightingAreas: [{ ...area, label: "  Podium  " }] })),
    );
    expect(request.lightingAreas[0].label).toBe("Podium");
    expect(request.lightingAreas[0].unitLoadVoltAmperesPerM2).toBeNull();
    expect(request.selectedGeneratorKva).toBeNull();
  });

  it("sends the output conductor conditions only when they are to be sized", () => {
    expect(buildGeneratorSetRequest(generatorSetSchema.parse(formInput())).outputConductor).toBeNull();

    const sized = buildGeneratorSetRequest(
      generatorSetSchema.parse(
        formInput({
          sizeOutputConductor: true,
          outputConductor: {
            ambientTempCelsius: "35",
            numberOfCurrentCarryingConductors: "3",
            numberOfParallelSets: "2",
            insulationType: "THHN",
            conductorMaterial: "COPPER",
            terminationTempRatingCelsius: "75",
          },
        }),
      ),
    );
    expect(sized.outputConductor).toEqual({
      ambientTempCelsius: 35,
      numberOfCurrentCarryingConductors: 3,
      numberOfParallelSets: 2,
      insulationType: "THHN",
      conductorMaterial: "COPPER",
      terminationTempRatingCelsius: 75,
    });
  });
});
