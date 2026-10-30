import type { NaturalVentingFormValues } from "./schema";
import type { FireCaseRequest, NaturalVentingRequest, VentZoneRequest } from "./types";

type ZoneValues = NaturalVentingFormValues["zones"][number];
type FireCaseValues = NaturalVentingFormValues["fireCases"][number];

function toZoneRequest(zone: ZoneValues): VentZoneRequest {
  return {
    name: zone.name.trim(),
    ceilingHeight: zone.ceilingHeight,
    ventCentreHeight: zone.ventCentreHeight,
    curtainDepth: zone.curtainDepth,
    zoneLength: zone.zoneLength,
    zoneWidth: zone.zoneWidth,
    ventDischargeCoefficient: zone.ventDischargeCoefficient,
    ventCount: zone.ventCount,
    ventTotalArea: zone.ventTotalArea,
    ventUnitLength: zone.ventUnitLength,
    ventUnitWidth: zone.ventUnitWidth,
    ventSpacing: zone.ventSpacing,
    ventToWallDistance: zone.ventToWallDistance,
    inletDischargeCoefficient: zone.inletDischargeCoefficient,
    // Only the chosen way of describing the inlet is sent: the API reads the area before the ratio,
    // so a value left behind in the hidden field would silently win.
    inletAreaRatio: zone.inletMode === "ratio" ? zone.inletAreaRatio : undefined,
    inletNetArea: zone.inletMode === "area" ? zone.inletNetArea : undefined,
    maxLayerTemperatureRise: zone.maxLayerTemperatureRise,
    maxFloorRadiantFlux: zone.maxFloorRadiantFlux,
    aisleWidth: zone.aisleWidth,
  };
}

function toFireCaseRequest(fire: FireCaseValues, zoneName: string): FireCaseRequest {
  const steady = fire.kind === "STEADY";
  return {
    name: fire.name.trim(),
    zoneName,
    kind: fire.kind,
    steadyHeatReleaseRate: steady ? fire.steadyHeatReleaseRate : undefined,
    growthTime: steady ? undefined : fire.growthTime,
    detectionTime: steady ? undefined : fire.detectionTime,
    designInterval: steady ? undefined : fire.designInterval,
    maxHeatReleaseRate: steady ? undefined : fire.maxHeatReleaseRate,
    fireDiameter: fire.diameterSource === "diameter" ? fire.fireDiameter : undefined,
    fireArea: fire.diameterSource === "area" ? fire.fireArea : undefined,
    unitHeatReleaseRate: fire.diameterSource === "unitHrr" ? fire.unitHeatReleaseRate : undefined,
    largestFireDimension: fire.largestFireDimension,
    fireBaseHeight: fire.fireBaseHeight,
    smokeLayerHeight: fire.smokeLayerHeight,
  };
}

/**
 * The request body for validated form values. Fire cases refer to their zone by key in the form;
 * the API takes the zone's name, so it is looked up here. Undefined fields drop out of the JSON.
 */
export function toNaturalVentingRequest(values: NaturalVentingFormValues): NaturalVentingRequest {
  const zoneNames = new Map(values.zones.map((zone) => [zone.key, zone.name.trim()]));
  return {
    ambientTemperature: values.ambientTemperature,
    ambientDensity: values.ambientDensity,
    specificHeat: values.specificHeat,
    layerEnergyFraction: values.layerEnergyFraction,
    growthConstant: values.growthConstant,
    zones: values.zones.map(toZoneRequest),
    fireCases: values.fireCases.map((fire) => toFireCaseRequest(fire, zoneNames.get(fire.zoneKey) ?? "")),
  };
}
