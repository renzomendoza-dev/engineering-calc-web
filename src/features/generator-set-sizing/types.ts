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

/** How the load is entered: built up from its parts, or given as a total for a building or a fire pump. */
export const LOAD_ENTRY_MODES = ["BUILD", "DIRECT"] as const;

export type LoadEntryMode = (typeof LOAD_ENTRY_MODES)[number];

/** The two loads that can be entered as a total. */
export const DIRECT_LOAD_KINDS = ["BUILDING", "FIRE_PUMP"] as const;

export type DirectLoadKind = (typeof DIRECT_LOAD_KINDS)[number];

export const DIRECT_LOAD_KIND_LABELS: Record<DirectLoadKind, string> = {
  BUILDING: "Building load",
  FIRE_PUMP: "Fire pump",
};

/** The units a total load is entered in. */
export const DIRECT_LOAD_UNITS = ["KVA", "KW", "AMPS"] as const;

export type DirectLoadUnit = (typeof DIRECT_LOAD_UNITS)[number];

export const DIRECT_LOAD_UNIT_LABELS: Record<DirectLoadUnit, string> = {
  KVA: "kVA",
  KW: "kW",
  AMPS: "A",
};

/** Mirrors calc-api's DirectLoadDto field-for-field. */
export interface DirectLoadRequest {
  label: string;
  kind: DirectLoadKind;
  amount: number;
  unit: DirectLoadUnit;
  powerFactor: number | null;
  continuous: boolean;
  lockedRotorAmps: number | null;
  startStep: number | null;
  startingCurrentPercent: number | null;
}

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
  startStep: number | null;
  startingCurrentPercent: number | null;
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
  subtransientReactancePercent: number | null;
  maximumVoltageDipPercent: number | null;
  directLoads: DirectLoadRequest[];
}

export type LoadKind = "LIGHTING" | "RECEPTACLE" | "OTHER" | "MOTOR" | DirectLoadKind;

export const LOAD_KIND_LABELS: Record<LoadKind, string> = {
  LIGHTING: "Lighting",
  RECEPTACLE: "Receptacles",
  OTHER: "Other load",
  MOTOR: "Motor",
  BUILDING: "Building load",
  FIRE_PUMP: "Fire pump",
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

/** Which of the two requirements set the required capacity. */
export type GoverningCase = "RUNNING_LOAD" | "MOTOR_STARTING";

/** Mirrors calc-api's StartingStepDto field-for-field. */
export interface StartingStep {
  step: number;
  motors: string;
  startingKva: number;
  runningKvaBefore: number;
  requiredGeneratorKva: number;
  voltageDipPercentAtSelected: number | null;
  withinDipLimit: boolean | null;
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
  runningRequiredKva: number;
  startingRequiredKva: number | null;
  governingCase: GoverningCase;
  startingSteps: StartingStep[];
  startingBasis: string | null;
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
  defaultSubtransientReactancePercent: number;
  defaultMaximumVoltageDipPercent: number;
  motorStartingDefaultsNote: string;
}
