import type { GeneratorSetFormValues } from "./schema";
import { OPTIONAL_STANDBY_CLASS, type GeneratorSetSizingRequest } from "./types";

/**
 * The form's values as the API takes them. Drops what the API does not read (the output conductor
 * toggle), sends a transfer mode only for optional standby, and sends the conductor conditions
 * only when they are to be sized. No arithmetic: every figure goes out as entered.
 */
export function buildGeneratorSetRequest(values: GeneratorSetFormValues): GeneratorSetSizingRequest {
  const conductor = values.outputConductor;
  return {
    standbyClass: values.standbyClass,
    optionalTransfer: values.standbyClass === OPTIONAL_STANDBY_CLASS ? values.optionalTransfer : null,
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
    })),
    generatorPowerFactor: values.generatorPowerFactor,
    spareCapacityPercent: values.spareCapacityPercent,
    selectedGeneratorKva: values.selectedGeneratorKva ?? null,
    designPreventsOverload: values.designPreventsOverload,
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
