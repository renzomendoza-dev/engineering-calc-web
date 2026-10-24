import type { GeneratorSetFormValues } from "./schema";
import { OPTIONAL_STANDBY_CLASS, type GeneratorSetSizingRequest } from "./types";

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
    directLoads: values.directLoads.map((load) => {
      const isPump = load.kind === "FIRE_PUMP";
      return {
        label: load.label.trim(),
        kind: load.kind,
        amount: load.amount,
        unit: load.unit,
        powerFactor: load.unit === "KW" ? (load.powerFactor ?? null) : null,
        // The checkbox is only offered for a building; a pump's duty is not asked for.
        continuous: isPump ? false : load.continuous,
        lockedRotorAmps: isPump ? (load.lockedRotorAmps ?? null) : null,
        startStep: isPump ? load.startStep : null,
        startingCurrentPercent: isPump ? load.startingCurrentPercent : null,
      };
    }),
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
