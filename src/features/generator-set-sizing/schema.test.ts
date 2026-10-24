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
    includeFirePump: false,
    firePump: firePumpForm(),
    subtransientReactancePercent: "20",
    maximumVoltageDipPercent: "15",
    ...overrides,
  };
}

type FirePumpForm = GeneratorSetFormInput["firePump"];

const pumpByHorsepower = {
  entry: "HORSEPOWER" as const,
  horsepowerLabel: "100",
  voltage: "460",
  fullLoadAmps: "",
  lockedRotorAmps: "",
};

const pumpByAmps = {
  entry: "AMPERES" as const,
  horsepowerLabel: "",
  voltage: "",
  fullLoadAmps: "40",
  lockedRotorAmps: "240",
};

/** The fire pump section as the form holds it: by horsepower, no jockey, no run. */
function firePumpForm(overrides: Partial<FirePumpForm> = {}): FirePumpForm {
  return {
    motor: pumpByHorsepower,
    includeJockey: false,
    jockey: { ...pumpByHorsepower, horsepowerLabel: "", voltage: "" },
    accessoryAmps: "",
    startStep: "1",
    startingCurrentPercent: "100",
    sizeSupplyRun: false,
    supplyRun: {
      ambientTempCelsius: "30",
      numberOfCurrentCarryingConductors: "3",
      numberOfParallelSets: "1",
      insulationType: "THHN",
      conductorMaterial: "COPPER",
      terminationTempRatingCelsius: "75",
      checkVoltageDrop: false,
      oneWayLengthMeters: "",
      conduitMaterial: "",
      startingPowerFactor: "",
      runningPowerFactor: "",
      cableStartingDropAllowancePercent: "",
    },
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
  amount: "250",
  unit: "KW" as const,
  powerFactor: "0.85",
  continuous: true,
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

  it("accepts a building total with no lighting, receptacles or motors", () => {
    expect(issuePaths(direct())).toEqual([]);
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

  it("sends only the building's total, with the power factor only for kW", () => {
    const request = buildGeneratorSetRequest(
      generatorSetSchema.parse(
        activeLoadsOnly(
          direct({ directLoads: [buildingRow, { ...buildingRow, unit: "KVA", amount: "180" }] }),
        ),
      ),
    );
    expect(request.lightingAreas).toEqual([]);
    expect(request.directLoads[0]).toMatchObject({ unit: "KW", powerFactor: 0.85 });
    expect(request.directLoads[1]).toMatchObject({ unit: "KVA", amount: 180, powerFactor: null });
  });
});

describe("a fire pump", () => {
  const withPump = (
    pump: Partial<FirePumpForm> = {},
    overrides: Partial<GeneratorSetFormInput> = {},
  ) => formInput({ includeFirePump: true, firePump: firePumpForm(pump), ...overrides });

  it("is not validated, nor sent, until it is switched on", () => {
    const hidden = formInput({
      firePump: firePumpForm({ motor: { ...pumpByHorsepower, horsepowerLabel: "" } }),
    });
    expect(issuePaths(hidden)).toEqual([]);
    expect(buildGeneratorSetRequest(generatorSetSchema.parse(hidden)).firePump).toBeNull();
  });

  it("is enough to size on its own, in either entry mode", () => {
    expect(issuePaths(withPump({}, { lightingAreas: [] }))).toEqual([]);
    expect(issuePaths(withPump({}, { lightingAreas: [], loadEntryMode: "DIRECT" }))).toEqual([]);
  });

  it("needs the horsepower and voltage, or the full-load current, of the way it is entered", () => {
    const noHorsepower = { ...pumpByHorsepower, horsepowerLabel: "", voltage: "" };
    expect(issuePaths(withPump({ motor: noHorsepower }))).toEqual([
      "firePump.motor.horsepowerLabel",
      "firePump.motor.voltage",
    ]);
    expect(issuePaths(withPump({ motor: { ...pumpByAmps, fullLoadAmps: "" } }))).toEqual([
      "firePump.motor.fullLoadAmps",
    ]);
    expect(issuePaths(withPump({ motor: pumpByAmps }))).toEqual([]);
  });

  it("checks the jockey pump only when there is one", () => {
    const empty = { ...pumpByHorsepower, horsepowerLabel: "", voltage: "" };
    expect(issuePaths(withPump({ jockey: empty }))).toEqual([]);
    expect(issuePaths(withPump({ includeJockey: true, jockey: empty }))).toEqual([
      "firePump.jockey.horsepowerLabel",
      "firePump.jockey.voltage",
    ]);
  });

  it("asks for the conductor conditions only when the run is to be sized", () => {
    const blankConductor = {
      ...firePumpForm().supplyRun,
      insulationType: "",
      conductorMaterial: "",
      terminationTempRatingCelsius: "",
    };
    expect(issuePaths(withPump({ supplyRun: blankConductor }))).toEqual([]);
    expect(issuePaths(withPump({ sizeSupplyRun: true, supplyRun: blankConductor }))).toEqual([
      "firePump.supplyRun.insulationType",
      "firePump.supplyRun.conductorMaterial",
      "firePump.supplyRun.terminationTempRatingCelsius",
    ]);
  });

  it("asks for the drop inputs only when the voltage drop is to be checked", () => {
    const run = firePumpForm().supplyRun;
    expect(issuePaths(withPump({ sizeSupplyRun: true, supplyRun: run }))).toEqual([]);
    expect(
      issuePaths(withPump({ sizeSupplyRun: true, supplyRun: { ...run, checkVoltageDrop: true } })),
    ).toEqual([
      "firePump.supplyRun.oneWayLengthMeters",
      "firePump.supplyRun.startingPowerFactor",
      "firePump.supplyRun.runningPowerFactor",
      "firePump.supplyRun.cableStartingDropAllowancePercent",
      "firePump.supplyRun.conduitMaterial",
    ]);
  });

  it("keeps the cable's share of the starting drop below the 15% it is part of", () => {
    const run = {
      ...firePumpForm().supplyRun,
      checkVoltageDrop: true,
      oneWayLengthMeters: "50",
      conduitMaterial: "PVC",
      startingPowerFactor: "0.3",
      runningPowerFactor: "0.85",
      cableStartingDropAllowancePercent: "15",
    };
    expect(issuePaths(withPump({ sizeSupplyRun: true, supplyRun: run }))).toEqual([
      "firePump.supplyRun.cableStartingDropAllowancePercent",
    ]);
  });

  it("is sent by horsepower with the other entry's fields null", () => {
    const request = buildGeneratorSetRequest(generatorSetSchema.parse(withPump()));
    expect(request.firePump?.motor).toEqual({
      horsepowerLabel: "100",
      voltage: 460,
      fullLoadAmps: null,
      lockedRotorAmps: null,
    });
    expect(request.firePump).toMatchObject({
      jockey: null,
      accessoryAmps: null,
      supplyRun: null,
      startStep: 1,
    });
  });

  it("is sent by current, with a locked-rotor current for the pump but not the jockey", () => {
    const request = buildGeneratorSetRequest(
      generatorSetSchema.parse(
        withPump({
          motor: pumpByAmps,
          includeJockey: true,
          jockey: { ...pumpByAmps, fullLoadAmps: "6", lockedRotorAmps: "36" },
          accessoryAmps: "2",
        }),
      ),
    );
    expect(request.firePump?.motor).toEqual({
      horsepowerLabel: null,
      voltage: null,
      fullLoadAmps: 40,
      lockedRotorAmps: 240,
    });
    expect(request.firePump?.jockey).toEqual({
      horsepowerLabel: null,
      voltage: null,
      fullLoadAmps: 6,
      lockedRotorAmps: null,
    });
    expect(request.firePump?.accessoryAmps).toBe(2);
  });

  it("sends the run and its drop inputs only as far as they are switched on", () => {
    const run = firePumpForm().supplyRun;
    const sizedOnly = buildGeneratorSetRequest(
      generatorSetSchema.parse(withPump({ sizeSupplyRun: true, supplyRun: run })),
    );
    expect(sizedOnly.firePump?.supplyRun).toMatchObject({
      insulationType: "THHN",
      terminationTempRatingCelsius: 75,
      oneWayLengthMeters: null,
      conduitMaterial: null,
      startingPowerFactor: null,
      cableStartingDropAllowancePercent: null,
    });

    const withDrop = buildGeneratorSetRequest(
      generatorSetSchema.parse(
        withPump({
          sizeSupplyRun: true,
          supplyRun: {
            ...run,
            checkVoltageDrop: true,
            oneWayLengthMeters: "120",
            conduitMaterial: "STEEL",
            startingPowerFactor: "0.3",
            runningPowerFactor: "0.85",
            cableStartingDropAllowancePercent: "5",
          },
        }),
      ),
    );
    expect(withDrop.firePump?.supplyRun).toMatchObject({
      oneWayLengthMeters: 120,
      conduitMaterial: "STEEL",
      startingPowerFactor: 0.3,
      runningPowerFactor: 0.85,
      cableStartingDropAllowancePercent: 5,
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
