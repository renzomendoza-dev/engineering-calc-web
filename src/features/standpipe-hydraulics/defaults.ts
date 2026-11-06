import type { FittingFormInput, SegmentFormInput, StandpipeFormInput } from "./schema";

/**
 * Keys are `segment-<n>`, with n one above the largest in use, so a new row never takes the key of
 * one that was deleted.
 */
function nextSegmentKey(existing: { key: string }[]): string {
  const used = existing
    .map((row) => Number(row.key.slice("segment-".length)))
    .filter((n) => Number.isInteger(n));
  return `segment-${Math.max(0, ...used) + 1}`;
}

/**
 * C starts at 120, the value for black steel in wet service in the C table the API serves
 * (Table 8.3.2.3); it stays editable because the AHJ may require another.
 */
export function newSegment(
  existing: { key: string }[],
  overrides: Partial<SegmentFormInput> = {},
): SegmentFormInput {
  return {
    key: nextSegmentKey(existing),
    label: "",
    role: "STANDPIPE",
    flowAddedGpm: "",
    hoseConnectionSize: "",
    pipeMaterial: "BI",
    schedule: "SCH40",
    nominalSize: "",
    cFactor: "120",
    pipeLengthFt: "",
    elevationRiseFt: "0",
    fittings: [],
    ...overrides,
  };
}

export function newFitting(): FittingFormInput {
  return { fittingType: "", quantity: "1", explicitEquivalentLengthFt: "" };
}

const HOSE_SEGMENT = newSegment([], {
  label: "Hose connection",
  role: "HOSE_PIPING",
});
const RISER_SEGMENT = newSegment([HOSE_SEGMENT], { label: "Standpipe", role: "STANDPIPE" });

export const DEFAULT_STANDPIPE_FORM: StandpipeFormInput = {
  projectName: "",
  standpipeClass: "CLASS_I",
  sprinklerProtection: "NONE",
  sprinklerHazard: "",
  sprinklerDemandGpm: "",
  additionalStandpipes: "0",
  floorAreaOver80000SqFt: false,
  horizontalStandpipeOnThreeConnections: false,
  fireDepartmentConnectionInlets: "",
  supplyDurationMinutes: "",
  flowAddedAtSupplyGpm: "",
  segments: [HOSE_SEGMENT, RISER_SEGMENT],
};
