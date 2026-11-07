import { EXPLICIT_FITTING, type StandpipeFormValues } from "./schema";
import type {
  HoseConnectionSize,
  StandpipeFdcLineRequest,
  StandpipeFittingRequest,
  StandpipeHydraulicRequest,
  StandpipeSegmentRequest,
} from "./types";

type SegmentValues = StandpipeFormValues["segments"][number];
type FittingValues = SegmentValues["fittings"][number];
type FdcValues = StandpipeFormValues["fireDepartmentConnections"][number];

function toFittingRequest(fitting: FittingValues): StandpipeFittingRequest {
  const explicit = fitting.fittingType === EXPLICIT_FITTING;
  return {
    fittingType: explicit ? undefined : fitting.fittingType,
    quantity: fitting.quantity,
    explicitEquivalentLengthFt: explicit ? fitting.explicitEquivalentLengthFt : undefined,
  };
}

function toSegmentRequest(segment: SegmentValues): StandpipeSegmentRequest {
  return {
    label: segment.label.trim(),
    role: segment.role,
    flowAddedGpm: segment.flowAddedGpm,
    hoseConnectionSize:
      segment.hoseConnectionSize === "" ? undefined : (segment.hoseConnectionSize as HoseConnectionSize),
    // Only where no hose connection takes the node; a flag left on behind a hose connection is dropped.
    otherStandpipeConnection:
      segment.hoseConnectionSize === "" && segment.otherStandpipeConnection ? true : undefined,
    // The design residual belongs to a hose connection; one left behind after the connection was removed is dropped.
    designResidualPressurePsi: segment.hoseConnectionSize === "" ? undefined : segment.designResidualPressurePsi,
    pipeMaterial: segment.pipeMaterial,
    schedule: segment.schedule,
    nominalSize: segment.nominalSize,
    cFactor: segment.cFactor,
    pipeLengthFt: segment.pipeLengthFt,
    elevationRiseFt: segment.elevationRiseFt,
    fittings: segment.fittings.map(toFittingRequest),
  };
}

/** One fire department connection: its one run of plain pipe, listed from the system outward. */
function toFdcRequest(connection: FdcValues): StandpipeFdcLineRequest {
  const label = connection.label.trim();
  return {
    label,
    flowGpm: connection.flowGpm,
    inlets: connection.inlets,
    segments: [
      {
        label: `${label} pipe`,
        role: "OTHER",
        pipeMaterial: connection.pipeMaterial,
        schedule: connection.schedule,
        nominalSize: connection.nominalSize,
        cFactor: connection.cFactor,
        pipeLengthFt: connection.pipeLengthFt,
        elevationRiseFt: connection.elevationRiseFt,
        fittings: connection.fittings.map(toFittingRequest),
      },
    ],
  };
}

/**
 * The request body for validated form values. Fields the form leaves blank drop out of the JSON,
 * so the API's own defaults apply (30 minutes, no flow added at the supply, no sprinklers).
 */
export function toStandpipeRequest(values: StandpipeFormValues): StandpipeHydraulicRequest {
  const sprinklered = values.sprinklerProtection !== "NONE";
  // Laterals, levels and a manual system are Class I and III matters; a Class II request leaves them out.
  const classIOrIII = values.standpipeClass !== "CLASS_II";
  return {
    standpipeClass: values.standpipeClass,
    sprinklerProtection: values.sprinklerProtection,
    // The hazard only matters, and the demand is only read, where there are sprinklers.
    sprinklerHazard:
      values.sprinklerProtection === "PARTIAL" && values.sprinklerHazard !== ""
        ? values.sprinklerHazard
        : undefined,
    sprinklerDemandGpm: sprinklered ? values.sprinklerDemandGpm : undefined,
    additionalStandpipes: values.additionalStandpipes,
    floorAreaOver80000SqFt: values.floorAreaOver80000SqFt,
    horizontalStandpipeOnThreeConnections: values.horizontalStandpipeOnThreeConnections,
    singleConnectionLaterals: classIOrIII ? values.singleConnectionLaterals : undefined,
    risersEndAtDifferentLevels: classIOrIII ? values.risersEndAtDifferentLevels : undefined,
    manualSystem: classIOrIII ? values.manualSystem : undefined,
    fireDepartmentConnectionInletSize: values.fireDepartmentConnectionInletSize,
    fireDepartmentConnectionInlets: values.fireDepartmentConnectionInlets,
    supplyDurationMinutes: values.supplyDurationMinutes,
    flowAddedAtSupplyGpm: values.flowAddedAtSupplyGpm,
    supplyStaticPressurePsi: values.supplyStaticPressurePsi,
    lowestHoseConnectionHeightFt: values.lowestHoseConnectionHeightFt,
    // Fire department connections are a Class I and III matter (10.7.1): a Class II request leaves them out.
    fireDepartmentConnections:
      values.standpipeClass !== "CLASS_II" && values.fireDepartmentConnections.length > 0
        ? values.fireDepartmentConnections.map(toFdcRequest)
        : undefined,
    segments: values.segments.map(toSegmentRequest),
  };
}
