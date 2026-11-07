import type { SelectOption } from "@/components/ui/SelectField";
import type { CommodityHeatReleaseEntry, DischargeCoefficientEntry } from "./types";

function thousands(value: number): string {
  return value.toLocaleString("en-US");
}

/** One option per Table 9.2.4.2 row (and the A.9.2.4.2 guidance), the coefficient shown in the label. */
export function dischargeOptions(rows: DischargeCoefficientEntry[]): SelectOption[] {
  return rows.map((row) => ({
    value: row.key,
    label: `${row.label}: ${row.dischargeCoefficient} (${row.clause})`,
  }));
}

/** One option per Table A.8.2.6 commodity, the rate shown in the label. */
export function commodityOptions(rows: CommodityHeatReleaseEntry[]): SelectOption[] {
  return rows.map((row) => ({
    value: row.key,
    label: `${row.label}: ${thousands(row.heatReleaseRateKwPerM2)} kW/m²`,
  }));
}

/** The coefficient of the picked row as the text the form field holds, or undefined for an unknown key. */
export function dischargeValue(rows: DischargeCoefficientEntry[], key: string): string | undefined {
  const row = rows.find((candidate) => candidate.key === key);
  return row === undefined ? undefined : String(row.dischargeCoefficient);
}

/** The rate of the picked commodity as the text the form field holds, or undefined for an unknown key. */
export function commodityValue(rows: CommodityHeatReleaseEntry[], key: string): string | undefined {
  const row = rows.find((candidate) => candidate.key === key);
  return row === undefined ? undefined : String(row.heatReleaseRateKwPerM2);
}
