import type { WireSizingResponse } from "@/features/wire-sizing/types";

/** The generator and the motors it feeds are single-phase or three-phase; no other supply is sized here. */
export const GENERATOR_PHASE_TYPES = ["THREE_PHASE", "SINGLE_PHASE"] as const;

export type GeneratorPhaseType = (typeof GENERATOR_PHASE_TYPES)[number];

export const GENERATOR_PHASE_LABELS: Record<GeneratorPhaseType, string> = {
  THREE_PHASE: "Three-phase",
  SINGLE_PHASE: "Single-phase",
};

/** The standby article that applies to the OPTIONAL class, which is the only one with a transfer mode. */
export const OPTIONAL_STANDBY_CLASS = "OPTIONAL";

/** Mirrors calc-api's LightingAreaDto field-for-field. */
export interface LightingAreaRequest {
  label: string;
  occupancy: string;
  areaType: string;
  floorAreaM2: number;
  unitLoadVoltAmperesPerM2: number | null;
  entireLightingUsedAtOnce: boolean;
  continuous: boolean;
}

/** Mirrors calc-api's ReceptacleGroupDto field-for-field. */
export interface ReceptacleGroupRequest {
  label: string;
  outlets: number;
  bankOrOfficeFloorAreaM2: number | null;
  continuous: boolean;
}

/** Mirrors calc-api's OtherLoadDto field-for-field. */
export interface OtherLoadRequest {
  label: string;
  voltAmperes: number;
  demandFactorPercent: number;
  continuous: boolean;
}

/** Mirrors calc-api's MotorLoadDto field-for-field. */
export interface MotorLoadRequest {
  label: string;
  horsepowerLabel: string;
  voltage: number;
  quantity: number;
}

/** Mirrors calc-api's OutputConductorDto field-for-field. */
export interface OutputConductorRequest {
  ambientTempCelsius: number;
  numberOfCurrentCarryingConductors: number;
  numberOfParallelSets: number;
  insulationType: string;
  conductorMaterial: string;
  terminationTempRatingCelsius: number;
}

/** Mirrors calc-api's GeneratorSetSizingRequest field-for-field. */
export interface GeneratorSetSizingRequest {
  standbyClass: string;
  optionalTransfer: string | null;
  phaseType: GeneratorPhaseType;
  voltage: number;
  lightingAreas: LightingAreaRequest[];
  receptacleGroups: ReceptacleGroupRequest[];
  applyReceptacleDemandFactor: boolean;
  otherLoads: OtherLoadRequest[];
  motors: MotorLoadRequest[];
  generatorPowerFactor: number;
  spareCapacityPercent: number;
  selectedGeneratorKva: number | null;
  designPreventsOverload: boolean;
  outputConductor: OutputConductorRequest | null;
}

export type LoadKind = "LIGHTING" | "RECEPTACLE" | "OTHER" | "MOTOR";

export const LOAD_KIND_LABELS: Record<LoadKind, string> = {
  LIGHTING: "Lighting",
  RECEPTACLE: "Receptacles",
  OTHER: "Other load",
  MOTOR: "Motor",
};

/** Mirrors calc-api's LoadRowDto field-for-field. */
export interface LoadRow {
  kind: LoadKind;
  label: string;
  connectedVoltAmperes: number;
  demandFactorPercent: number;
  demandVoltAmperes: number;
  continuous: boolean;
  basis: string;
}

/** Mirrors calc-api's RequirementDto field-for-field. */
export interface Requirement {
  citation: string;
  text: string;
}

/** Mirrors calc-api's GeneratorSetSizingResponse field-for-field. */
export interface GeneratorSetSizingResponse {
  loadRows: LoadRow[];
  connectedKva: number;
  demandKva: number;
  demandCurrentAmps: number;
  spareCapacityPercent: number;
  requiredKva: number;
  requiredKw: number;
  generatorPowerFactor: number;
  loadFeederMinimumAmpacityAmps: number | null;
  loadFeederBasis: string | null;
  recommendedStandardKva: number | null;
  selectedGeneratorKva: number | null;
  selectedIsUserEntered: boolean;
  selectedMeetsRequired: boolean | null;
  loadPercentOfSelected: number | null;
  nameplateCurrentAmps: number | null;
  outputConductorFactor: number;
  minimumOutputConductorAmpacityAmps: number | null;
  outputConductor: WireSizingResponse | null;
  capacityCitation: string;
  capacityBasis: string;
  requirements: Requirement[];
  standardSizesNote: string;
  warnings: string[];
}

/** Mirrors calc-api's LightingOccupancyDto field-for-field. */
export interface LightingOccupancyOption {
  key: string;
  label: string;
  voltAmperesPerM2: number;
  fullDemandWhenAllLightingInUse: boolean;
  note: string | null;
}

/** Mirrors calc-api's LightingAreaTypeDto field-for-field. */
export interface LightingAreaTypeOption {
  key: string;
  label: string;
  voltAmperesPerM2: number | null;
}

/** Mirrors calc-api's StandbyClassOptionDto field-for-field. */
export interface StandbyClassOption {
  key: string;
  label: string;
  capacityCitation: string;
}

/** Mirrors calc-api's OptionalTransferOptionDto field-for-field. */
export interface OptionalTransferOption {
  key: string;
  label: string;
  citation: string;
  text: string;
}

/** Mirrors calc-api's GeneratorSetReferenceResponse field-for-field. */
export interface GeneratorSetReference {
  lightingOccupancies: LightingOccupancyOption[];
  lightingAreaTypes: LightingAreaTypeOption[];
  standbyClasses: StandbyClassOption[];
  optionalTransfers: OptionalTransferOption[];
  standardSizesKva: number[];
  standardSizesNote: string;
  defaultGeneratorPowerFactor: number;
  defaultGeneratorPowerFactorNote: string;
}
