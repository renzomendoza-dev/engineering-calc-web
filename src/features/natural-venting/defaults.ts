import type { FireCaseFormInput, NaturalVentingFormInput, ZoneFormInput } from "./schema";

/**
 * Keys are `<prefix>-<n>`, with n one above the largest already in use, so a new row never takes
 * the key of one that was deleted and a fire case never ends up pointing at a different zone.
 */
function nextKey(prefix: string, existing: { key: string }[]): string {
  const used = existing
    .map((row) => Number(row.key.slice(prefix.length + 1)))
    .filter((n) => Number.isInteger(n));
  return `${prefix}-${Math.max(0, ...used) + 1}`;
}

export function newZone(existing: { key: string; name: string }[]): ZoneFormInput {
  const key = nextKey("zone", existing);
  return {
    key,
    name: `Zone ${key.slice("zone-".length)}`,
    ceilingHeight: "",
    ventCentreHeight: "",
    curtainDepth: "",
    zoneLength: "",
    zoneWidth: "",
    ventDischargeCoefficient: "",
    ventCount: "",
    ventTotalArea: "",
    ventUnitLength: "",
    ventUnitWidth: "",
    ventSpacing: "",
    ventToWallDistance: "",
    inletDischargeCoefficient: "",
    inletMode: "ratio",
    inletAreaRatio: "",
    inletNetArea: "",
    maxLayerTemperatureRise: "",
    maxFloorRadiantFlux: "",
    aisleWidth: "",
  };
}

export function newFireCase(
  existing: { key: string; name: string }[],
  zoneKey: string,
): FireCaseFormInput {
  const key = nextKey("fire", existing);
  return {
    key,
    name: `Fire ${key.slice("fire-".length)}`,
    zoneKey,
    kind: "STEADY",
    steadyHeatReleaseRate: "",
    growthTime: "",
    detectionTime: "",
    designInterval: "",
    maxHeatReleaseRate: "",
    diameterSource: "unitHrr",
    fireDiameter: "",
    fireArea: "",
    unitHeatReleaseRate: "",
    largestFireDimension: "",
    fireBaseHeight: "",
    smokeLayerHeight: "",
  };
}

const FIRST_ZONE = newZone([]);

export const DEFAULT_NATURAL_VENTING_FORM: NaturalVentingFormInput = {
  projectName: "",
  ambientTemperature: "",
  ambientDensity: "",
  specificHeat: "",
  layerEnergyFraction: "",
  growthConstant: "",
  zones: [FIRST_ZONE],
  fireCases: [newFireCase([], FIRST_ZONE.key)],
};
