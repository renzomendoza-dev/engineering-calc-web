import { buildNetwork, pipeRuns } from "./network";
import type { SprinklerFormValues } from "./schema";
import type {
  FittingEquivalentLengthTableRow,
  SprinklerHydraulicRequest,
  WaterSupplyRequest,
} from "./types";

/** Empty string -> null, so an untouched optional text field isn't sent as "". */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Form values -> API request body. Pure, and the only place the form's shape meets the API's.
 *
 * Drops the form-only fields (project name and the design defaults that pre-fill rows) and omits
 * empty fitting/device lists the way the backend documents as "may be omitted". No arithmetic
 * happens here: each pipe's C factor is already a concrete value, pre-filled from the step 2
 * default and overridable per pipe, because the API requires one per segment.
 *
 * The network is the one real translation: the form holds branches with their sprinklers and pipes,
 * and buildNetwork lays that out as the API's sprinklers and segments with generated node ids.
 */
export function toSprinklerRequest(values: SprinklerFormValues): SprinklerHydraulicRequest {
  const network = buildNetwork(values.network);

  return {
    systemType: values.systemType,
    hazard: values.hazard,
    densityGpmPerSqFt: values.densityGpmPerSqFt,
    designAreaSqFt: values.designAreaSqFt,
    hoseStreamGpm: values.hoseStreamGpm,
    hoseStreamNodeId: orNull(values.hoseStreamNodeId),
    // Not asked for: the start is the design flow's pressure or the minimum operating pressure,
    // whichever is greater, and the API works that out.
    assumedStartPressurePsi: null,
    sprinklers: network.sprinklers.map((sprinkler) => ({
      nodeId: sprinkler.nodeId,
      kFactor: sprinkler.kFactor,
      // Every sprinkler covers the same area, entered once in step 1.
      coverageAreaSqFt: values.coveragePerSprinklerSqFt,
    })),
    segments: network.segments,
    waterSupply: toWaterSupply(values),
    deviceLosses:
      values.deviceLosses.length > 0
        ? values.deviceLosses.map((device) => ({
            name: device.name.trim(),
            pressureLossPsi: device.pressureLossPsi,
          }))
        : null,
  };
}

/**
 * The supply block the API expects for the chosen source, or null for "none yet".
 *
 * Null is a real answer, not a missing one: the API calculates the demand and returns a null
 * margin and verdict, which is the honest result for a cistern or tank awaiting a pump. Only the
 * chosen source's block is sent; the other is null, which the API requires.
 */
function toWaterSupply(values: SprinklerFormValues): WaterSupplyRequest | null {
  switch (values.supplySource) {
    case "NONE":
      return null;
    case "GRAVITY_TANK":
      return {
        source: "GRAVITY_TANK",
        flowTest: null,
        gravityTank: {
          // Non-null by the time this runs: the schema requires it for this source.
          waterLevelHeightFt: values.gravityTank.waterLevelHeightFt ?? 0,
          outletRuns:
            values.gravityTank.outletRuns.length > 0
              ? values.gravityTank.outletRuns.map((run) => ({
                  pipeMaterial: run.pipeMaterial,
                  schedule: orNull(run.schedule),
                  nominalSize: run.nominalSize,
                  // Defined by the time this runs: the schema requires both for this source.
                  cFactor: run.cFactor ?? 0,
                  pipeLengthFt: run.pipeLengthFt ?? 0,
                  fittings:
                    run.fittings.length > 0
                      ? run.fittings.map((fitting) => ({
                          fittingType: orNull(fitting.fittingType),
                          quantity: fitting.quantity,
                          explicitEquivalentLengthFt: fitting.explicitEquivalentLengthFt ?? null,
                        }))
                      : null,
                }))
              : null,
        },
      };
    case "FLOW_TEST":
    default:
      return {
        source: "FLOW_TEST",
        flowTest: {
          staticPressurePsi: values.waterSupply.staticPressurePsi ?? 0,
          residualPressurePsi: values.waterSupply.residualPressurePsi ?? 0,
          flowAtResidualGpm: values.waterSupply.flowAtResidualGpm ?? 0,
        },
        gravityTank: null,
      };
  }
}

/**
 * The published equivalent length for this fitting at this nominal size, or undefined when the
 * reference table has nothing for that combination.
 */
export function publishedFittingLength(
  fittingType: string | undefined,
  nominalSize: string | undefined,
  table: FittingEquivalentLengthTableRow[],
): number | undefined {
  if (!fittingType || !nominalSize) return undefined;
  const row = table.find((entry) => entry.fittingType === fittingType);
  return row?.equivalentLengthFtByNominalSize[nominalSize];
}

/**
 * Whether the user must type an equivalent length for this fitting. True when no type is chosen,
 * and also when a type is chosen whose published table has no value for that size — the backend
 * rejects that combination ("No published equivalent length"), so the form asks for the number
 * instead of sending a request that cannot succeed. Every fitting type currently publishes an
 * empty table, so in practice this is always true today; it resolves itself as the reference data
 * is filled in, with no frontend change.
 */
export function fittingNeedsExplicitLength(
  fittingType: string | undefined,
  nominalSize: string | undefined,
  table: FittingEquivalentLengthTableRow[],
): boolean {
  return publishedFittingLength(fittingType, nominalSize, table) === undefined;
}

/**
 * Fittings whose equivalent length can't be resolved and have no explicit length typed in. The
 * live calculation waits while any exist, since the API would reject the request.
 *
 * Walks every pipe in the network -- a fitting is as likely on a branch pipe as on the riser -- and
 * reports each by its own form path, which is where the missing figure is asked for.
 */
export function unresolvedFittingPaths(
  values: SprinklerFormValues,
  table: FittingEquivalentLengthTableRow[],
): string[] {
  const paths: string[] = [];
  for (const { path, run } of pipeRuns(values.network)) {
    run.fittings.forEach((fitting, fittingIndex) => {
      const needsExplicit = fittingNeedsExplicitLength(fitting.fittingType, run.nominalSize, table);
      if (needsExplicit && fitting.explicitEquivalentLengthFt === undefined) {
        paths.push(`${path}.fittings.${fittingIndex}.explicitEquivalentLengthFt`);
      }
    });
  }
  return paths;
}
