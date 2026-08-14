/**
 * This table is for the quick-conversion utility only. It should be reviewed
 * against calc-core's future ConductorPropertiesResolver reference data for
 * consistency once that exists.
 */
export interface WireSizeEntry {
  awg: string;
  mm2: number;
}

export const WIRE_SIZE_TABLE: WireSizeEntry[] = [
  { awg: "14", mm2: 2.08 },
  { awg: "12", mm2: 3.31 },
  { awg: "10", mm2: 5.261 },
  { awg: "8", mm2: 8.367 },
  { awg: "6", mm2: 13.3 },
  { awg: "4", mm2: 21.15 },
  { awg: "3", mm2: 26.67 },
  { awg: "2", mm2: 33.62 },
  { awg: "1", mm2: 42.41 },
  { awg: "1/0", mm2: 53.49 },
  { awg: "2/0", mm2: 67.43 },
  { awg: "3/0", mm2: 85.01 },
  { awg: "4/0", mm2: 107.2 },
];

export function awgToMm2(awg: string): number | undefined {
  return WIRE_SIZE_TABLE.find((entry) => entry.awg === awg)?.mm2;
}

/** AWG sizes are discrete, so an arbitrary mm² input resolves to its closest standard size. */
export function nearestAwgForMm2(mm2: number): WireSizeEntry {
  return WIRE_SIZE_TABLE.reduce((closest, entry) =>
    Math.abs(entry.mm2 - mm2) < Math.abs(closest.mm2 - mm2) ? entry : closest,
  );
}
