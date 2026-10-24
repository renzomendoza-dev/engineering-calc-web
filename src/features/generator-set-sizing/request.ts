import type { GeneratorSetFormValues } from "./schema";
import {
  OPTIONAL_STANDBY_CLASS,
  type FirePumpRequest,
  type GeneratorSetSizingRequest,
  type PumpMotorRequest,
} from "./types";

type FirePumpValues = GeneratorSetFormValues["firePump"];
type PumpValues = FirePumpValues["motor"];

/**
 * One of the two ways of entering a pump goes out, the other's fields as null. Only the fire pump
 * motor takes a locked-rotor current: the pressure maintenance pump's is not used.
 */
function buildPumpMotor(pump: PumpValues, isFirePumpMotor: boolean): PumpMotorRequest {
  if (pump.entry === "HORSEPOWER") {
    return {
      horsepowerLabel: pump.horsepowerLabel,
      voltage: pump.voltage ?? null,
      fullLoadAmps: null,
      lockedRotorAmps: null,
    };
  }
  return {
    horsepowerLabel: null,
    voltage: null,
    fullLoadAmps: pump.fullLoadAmps ?? null,
    lockedRotorAmps: isFirePumpMotor ? (pump.lockedRotorAmps ?? null) : null,
  };
}

function buildFirePump(pump: FirePumpValues): FirePumpRequest {
  const run = pump.supplyRun;
  return {
    motor: buildPumpMotor(pump.motor, true),
    jockey: pump.includeJockey ? buildPumpMotor(pump.jockey, false) : null,
    accessoryAmps: pump.accessoryAmps ?? null,
    startStep: pump.startStep,
    startingCurrentPercent: pump.startingCurrentPercent,
    supplyRun: pump.sizeSupplyRun
      ? {
          ambientTempCelsius: run.ambientTempCelsius,
          numberOfCurrentCarryingConductors: run.numberOfCurrentCarryingConductors,
          numberOfParallelSets: run.numberOfParallelSets,
          insulationType: run.insulationType,
          conductorMaterial: run.conductorMaterial,
          terminationTempRatingCelsius: run.terminationTempRatingCelsius ?? 0,
          oneWayLengthMeters: run.checkVoltageDrop ? (run.oneWayLengthMeters ?? null) : null,
          conduitMaterial: run.checkVoltageDrop ? run.conduitMaterial : null,
          startingPowerFactor: run.checkVoltageDrop ? (run.startingPowerFactor ?? null) : null,
          runningPowerFactor: run.checkVoltageDrop ? (run.runningPowerFactor ?? null) : null,
          cableStartingDropAllowancePercent: run.checkVoltageDrop
            ? (run.cableStartingDropAllowancePercent ?? null)
            : null,
        }
      : null,
  };
}

/**
 * The form's values as the API takes them. Drops what the API does not read (the output conductor
 * toggle), sends a transfer mode only for optional standby, and sends the conductor conditions
 * only when they are to be sized. No arithmetic: every figure goes out as entered.
 */
export function buildGeneratorSetRequest(
  values: GeneratorSetFormValues,
): GeneratorSetSizingRequest {
  const conductor = values.outputConductor;
  return {
    standbyClass: values.standbyClass,
    optionalTransfer:
      values.standbyClass === OPTIONAL_STANDBY_CLASS ? values.optionalTransfer : null,
    phaseType: values.phaseType,
    voltage: values.voltage,
    lightingAreas: values.lightingAreas.map((area) => ({
      label: area.label.trim(),
      occupancy: area.occupancy,
      areaType: area.areaType || "GENERAL",
      floorAreaM2: area.floorAreaM2,
      unitLoadVoltAmperesPerM2: area.unitLoadVoltAmperesPerM2 ?? null,
      entireLightingUsedAtOnce: area.entireLightingUsedAtOnce,
      continuous: area.continuous,
    })),
    receptacleGroups: values.receptacleGroups.map((group) => ({
      label: group.label.trim(),
      outlets: group.outlets,
      bankOrOfficeFloorAreaM2: group.bankOrOfficeFloorAreaM2 ?? null,
      continuous: group.continuous,
    })),
    applyReceptacleDemandFactor: values.applyReceptacleDemandFactor,
    otherLoads: values.otherLoads.map((load) => ({
      label: load.label.trim(),
      voltAmperes: load.voltAmperes,
      demandFactorPercent: load.demandFactorPercent,
      continuous: load.continuous,
    })),
    motors: values.motors.map((motor) => ({
      label: motor.label.trim(),
      horsepowerLabel: motor.horsepowerLabel,
      voltage: motor.voltage,
      quantity: motor.quantity,
      startStep: motor.startStep,
      startingCurrentPercent: motor.startingCurrentPercent,
    })),
    directLoads: values.directLoads.map((load) => ({
      label: load.label.trim(),
      amount: load.amount,
      unit: load.unit,
      powerFactor: load.unit === "KW" ? (load.powerFactor ?? null) : null,
      continuous: load.continuous,
    })),
    firePump: values.includeFirePump ? buildFirePump(values.firePump) : null,
    generatorPowerFactor: values.generatorPowerFactor,
    spareCapacityPercent: values.spareCapacityPercent,
    selectedGeneratorKva: values.selectedGeneratorKva ?? null,
    designPreventsOverload: values.designPreventsOverload,
    subtransientReactancePercent: values.subtransientReactancePercent ?? null,
    maximumVoltageDipPercent: values.maximumVoltageDipPercent ?? null,
    outputConductor: values.sizeOutputConductor
      ? {
          ambientTempCelsius: conductor.ambientTempCelsius,
          numberOfCurrentCarryingConductors: conductor.numberOfCurrentCarryingConductors,
          numberOfParallelSets: conductor.numberOfParallelSets,
          insulationType: conductor.insulationType,
          conductorMaterial: conductor.conductorMaterial,
          terminationTempRatingCelsius: conductor.terminationTempRatingCelsius ?? 0,
        }
      : null,
  };
}
