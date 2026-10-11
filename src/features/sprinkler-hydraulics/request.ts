import type { SprinklerFormValues } from "./schema";
import type { FittingEquivalentLengthTableRow, SprinklerHydraulicRequest } from "./types";

/** Empty string -> null, so an untouched optional text field isn't sent as "". */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Form values -> API request body. Pure, and the only place the form's shape meets the API's.
 *
 * Drops the form-only fields (project name and the design defaults that pre-fill rows), trims node
 * ids, and omits empty fitting/device lists the way the backend documents as "may be omitted".
 * No arithmetic happens here: each row's C factor is already a concrete value, pre-filled from the
 * step 2 default and overridable per row, because the API requires one per segment.
 */
export function toSprinklerRequest(values: SprinklerFormValues): SprinklerHydraulicRequest {
  return {
    systemType: values.systemType,
    hazard: values.hazard,
    densityGpmPerSqFt: values.densityGpmPerSqFt,
    designAreaSqFt: values.designAreaSqFt,
    hoseStreamGpm: values.hoseStreamGpm,
    hoseStreamNodeId: orNull(values.hoseStreamNodeId),
    assumedStartPressurePsi: values.assumedStartPressurePsi,
    sprinklers: values.sprinklers.map((sprinkler) => ({
      nodeId: sprinkler.nodeId.trim(),
      kFactor: sprinkler.kFactor,
      coverageAreaSqFt: sprinkler.coverageAreaSqFt,
    })),
    segments: values.segments.map((segment) => ({
      fromNodeId: segment.fromNodeId.trim(),
      toNodeId: segment.toNodeId.trim(),
      pipeMaterial: segment.pipeMaterial,
      schedule: orNull(segment.schedule),
      nominalSize: segment.nominalSize,
      cFactor: segment.cFactor,
      pipeLengthFt: segment.pipeLengthFt,
      elevationChangeFt: segment.elevationChangeFt,
      fittings:
        segment.fittings.length > 0
          ? segment.fittings.map((fitting) => ({
              fittingType: orNull(fitting.fittingType),
              quantity: fitting.quantity,
              explicitEquivalentLengthFt: fitting.explicitEquivalentLengthFt ?? null,
            }))
          : null,
    })),
    waterSupply: {
      staticPressurePsi: values.waterSupply.staticPressurePsi,
      residualPressurePsi: values.waterSupply.residualPressurePsi,
      flowAtResidualGpm: values.waterSupply.flowAtResidualGpm,
    },
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
 */
export function unresolvedFittingPaths(
  values: SprinklerFormValues,
  table: FittingEquivalentLengthTableRow[],
): string[] {
  const paths: string[] = [];
  values.segments.forEach((segment, segmentIndex) => {
    segment.fittings.forEach((fitting, fittingIndex) => {
      const needsExplicit = fittingNeedsExplicitLength(fitting.fittingType, segment.nominalSize, table);
      if (needsExplicit && fitting.explicitEquivalentLengthFt === undefined) {
        paths.push(`segments.${segmentIndex}.fittings.${fittingIndex}.explicitEquivalentLengthFt`);
      }
    });
  });
  return paths;
}
