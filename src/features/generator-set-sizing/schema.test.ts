import { describe, expect, it } from "vitest";
import { buildGeneratorSetRequest } from "./request";
import { activeLoadsOnly, generatorSetSchema, type GeneratorSetFormInput } from "./schema";

/**
 * Inputs are shaped the way react-hook-form hands them to the resolver: numeric fields arrive as
 * strings from NumberField, and a blank optional field arrives as "".
 */
function formInput(overrides: Partial<GeneratorSetFormInput> = {}): GeneratorSetFormInput {
  return {
    standbyClass: "EMERGENCY",
    loadEntryMode: "BUILD",
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
    directLoads: [],
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
    subtransientReactancePercent: "20",
    maximumVoltageDipPercent: "15",
    ...overrides,
  };
}

const motorRow = {
  label: "",
  horsepowerLabel: "10",
  voltage: "230",
  quantity: "1",
  startStep: "1",
  startingCurrentPercent: "100",
};

/** What the form's resolver does: validate only the loads of the entry mode in use. */
function issuePaths(input: GeneratorSetFormInput): string[] {
  const result = generatorSetSchema.safeParse(activeLoadsOnly(input));
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

const buildingRow = {
  label: "Tower",
  kind: "BUILDING" as const,
  amount: "250",
  unit: "KW" as const,
  powerFactor: "0.85",
  continuous: true,
  lockedRotorAmps: "",
  startStep: "1",
  startingCurrentPercent: "100",
};

const pumpRow = {
  ...buildingRow,
  label: "Fire pump",
  kind: "FIRE_PUMP" as const,
  amount: "30",
  unit: "AMPS" as const,
  powerFactor: "",
  continuous: false,
  lockedRotorAmps: "180",
};

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
    expect(issuePaths(formInput({ standbyClass: "OPTIONAL", optionalTransfer: "MANUAL" }))).toEqual(
      [],
    );
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
    const load = {
      label: "Pump room",
      voltAmperes: "5000",
      demandFactorPercent: "120",
      continuous: false,
    };
    expect(issuePaths(formInput({ otherLoads: [load] }))).toEqual([
      "otherLoads.0.demandFactorPercent",
    ]);
  });

  it("asks for the motor's horsepower and voltage", () => {
    const motor = { ...motorRow, horsepowerLabel: "", voltage: "" };
    expect(issuePaths(formInput({ motors: [motor] }))).toEqual([
      "motors.0.horsepowerLabel",
      "motors.0.voltage",
    ]);
  });

  it("limits a motor's start step and starting current", () => {
    const motor = { ...motorRow, startStep: "0", startingCurrentPercent: "120" };
    expect(issuePaths(formInput({ motors: [motor] }))).toEqual([
      "motors.0.startStep",
      "motors.0.startingCurrentPercent",
    ]);
  });

  it("takes both the reactance and the dip limit, or neither", () => {
    expect(issuePaths(formInput({ subtransientReactancePercent: "" }))).toEqual([
      "subtransientReactancePercent",
    ]);
    expect(issuePaths(formInput({ maximumVoltageDipPercent: "" }))).toEqual([
      "maximumVoltageDipPercent",
    ]);
    expect(
      issuePaths(formInput({ subtransientReactancePercent: "", maximumVoltageDipPercent: "" })),
    ).toEqual([]);
  });

  it("keeps the dip limit below 100% and the reactance positive", () => {
    expect(issuePaths(formInput({ maximumVoltageDipPercent: "100" }))).toEqual([
      "maximumVoltageDipPercent",
    ]);
    expect(issuePaths(formInput({ subtransientReactancePercent: "0" }))).toEqual([
      "subtransientReactancePercent",
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

describe("entering the total load directly", () => {
  const direct = (overrides: Partial<GeneratorSetFormInput> = {}) =>
    formInput({
      loadEntryMode: "DIRECT",
      lightingAreas: [],
      directLoads: [buildingRow],
      ...overrides,
    });

  it("accepts a building total and a fire pump with no lighting, receptacles or motors", () => {
    expect(issuePaths(direct({ directLoads: [buildingRow, pumpRow] }))).toEqual([]);
  });

  it("asks for at least one total load", () => {
    expect(issuePaths(direct({ directLoads: [] }))).toEqual(["directLoads"]);
  });

  it("ignores half-filled rows left in the lists of the other mode", () => {
    const unfinishedMotor = {
      label: "",
      horsepowerLabel: "",
      voltage: "",
      quantity: "",
      startStep: "1",
      startingCurrentPercent: "100",
    };
    expect(issuePaths(direct({ motors: [unfinishedMotor] }))).toEqual([]);
    expect(
      issuePaths(
        formInput({ loadEntryMode: "BUILD", directLoads: [{ ...buildingRow, amount: "" }] }),
      ),
    ).toEqual([]);
  });

  it("empties the other mode's lists, so they are neither validated nor sent", () => {
    const masked = activeLoadsOnly(direct());
    expect(masked.lightingAreas).toEqual([]);
    expect(masked.motors).toEqual([]);
    expect(masked.directLoads).toHaveLength(1);
    expect(activeLoadsOnly(formInput({ directLoads: [buildingRow] })).directLoads).toEqual([]);
  });

  it("needs a power factor for a load in kW, and a positive amount", () => {
    expect(issuePaths(direct({ directLoads: [{ ...buildingRow, powerFactor: "" }] }))).toEqual([
      "directLoads.0.powerFactor",
    ]);
    expect(
      issuePaths(
        direct({ directLoads: [{ ...buildingRow, unit: "KVA", powerFactor: "", amount: "0" }] }),
      ),
    ).toEqual(["directLoads.0.amount"]);
  });

  it("sends the fire pump's starting figures and a building's as null", () => {
    const request = buildGeneratorSetRequest(
      generatorSetSchema.parse(activeLoadsOnly(direct({ directLoads: [buildingRow, pumpRow] }))),
    );
    expect(request.lightingAreas).toEqual([]);
    expect(request.directLoads[0]).toMatchObject({
      kind: "BUILDING",
      unit: "KW",
      powerFactor: 0.85,
      lockedRotorAmps: null,
      startStep: null,
      startingCurrentPercent: null,
    });
    expect(request.directLoads[1]).toMatchObject({
      kind: "FIRE_PUMP",
      continuous: false,
      unit: "AMPS",
      powerFactor: null,
      lockedRotorAmps: 180,
      startStep: 1,
      startingCurrentPercent: 100,
    });
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

  it("sends the starting check inputs, or null where they are cleared", () => {
    const checked = buildGeneratorSetRequest(
      generatorSetSchema.parse(formInput({ motors: [motorRow] })),
    );
    expect(checked.subtransientReactancePercent).toBe(20);
    expect(checked.maximumVoltageDipPercent).toBe(15);
    expect(checked.motors[0]).toMatchObject({ startStep: 1, startingCurrentPercent: 100 });

    const skipped = buildGeneratorSetRequest(
      generatorSetSchema.parse(
        formInput({ subtransientReactancePercent: "", maximumVoltageDipPercent: "" }),
      ),
    );
    expect(skipped.subtransientReactancePercent).toBeNull();
    expect(skipped.maximumVoltageDipPercent).toBeNull();
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
    expect(
      buildGeneratorSetRequest(generatorSetSchema.parse(formInput())).outputConductor,
    ).toBeNull();

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
