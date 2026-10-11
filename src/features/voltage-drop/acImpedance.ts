import type { ConductorImpedanceTableRow, ConductorMaterial, ConduitMaterial } from "./types";

/**
 * Which conductor sizes an AC calculation can actually use.
 *
 * PEC Table 10.1.1.9 is narrower than the size list the form offers: it has no row at all for the
 * smallest and largest sizes (0.75, 1.25, 600, 750, 875 and 1000 mm2 at the time of writing), and
 * the rows it does have leave individual material/conduit columns blank. Either gap makes the API
 * reject the request -- "No impedance data for conductor size 0.75", "No resistance data for size
 * 2.0, material ALUMINUM, conduit PVC" -- so the form uses this to mark those sizes unselectable
 * while the circuit is AC, rather than letting the user find out after submitting.
 *
 * DC is unaffected: it resolves from the DC resistance table, which covers every size offered.
 *
 * Derived from the published table rather than a hardcoded list of the gaps, so new reference data
 * changes what the form offers with no code change here.
 */
function acResistanceFor(
  row: ConductorImpedanceTableRow,
  conductorMaterial: ConductorMaterial,
  conduitMaterial: ConduitMaterial,
): number | null {
  if (conductorMaterial === "COPPER") {
    switch (conduitMaterial) {
      case "PVC":
        return row.resistanceCopperPvcOhmsPer305m;
      case "ALUMINUM":
        return row.resistanceCopperAluminumConduitOhmsPer305m;
      case "STEEL":
        return row.resistanceCopperSteelOhmsPer305m;
    }
  }
  switch (conduitMaterial) {
    case "PVC":
      return row.resistanceAluminumWirePvcOhmsPer305m;
    case "ALUMINUM":
      return row.resistanceAluminumWireAluminumConduitOhmsPer305m;
    case "STEEL":
      return row.resistanceAluminumWireSteelOhmsPer305m;
  }
}

/**
 * Whether an AC calculation at this size, conductor material and conduit material would resolve.
 *
 * Returns true whenever the answer isn't knowable — no table loaded yet, or no material chosen —
 * so a failed or pending reference fetch never hides sizes the user could legitimately pick. The
 * API still has the final say.
 */
export function hasAcImpedanceData(
  rows: ConductorImpedanceTableRow[],
  sizeLabel: string,
  conductorMaterial: ConductorMaterial | "" | null | undefined,
  conduitMaterial: ConduitMaterial | "" | null | undefined,
): boolean {
  if (rows.length === 0 || !conductorMaterial || !conduitMaterial) return true;
  const row = rows.find((entry) => entry.sizeLabel === sizeLabel);
  if (!row) return false;
  return acResistanceFor(row, conductorMaterial, conduitMaterial) !== null;
}
