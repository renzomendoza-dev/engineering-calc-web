import type { SelectOption } from "@/components/ui/SelectField";
import type { StandpipeHoseNozzleEntry } from "./types";

/** One option per Table A.10.2.6 row, the pressure and flow shown in the label; a row marked verify says so. */
export function hoseNozzleOptions(rows: StandpipeHoseNozzleEntry[]): SelectOption[] {
  return rows.map((row) => ({
    value: String(row.number),
    label: `${row.number}. ${row.label}: ${row.outletPressurePsi} psi at ${row.flowGpm} gpm${
      row.confidence === "verified" ? "" : " (verify)"
    }`,
  }));
}

/** The outlet pressure of the picked row as the text the form field holds, or undefined for an unknown key. */
export function hoseNozzleValue(rows: StandpipeHoseNozzleEntry[], key: string): string | undefined {
  const row = rows.find((candidate) => String(candidate.number) === key);
  return row === undefined ? undefined : String(row.outletPressurePsi);
}
