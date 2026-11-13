import { formatFixed as fixed } from "@/lib/format";
import type { CheckBasis, ComplianceCheck, FireCaseKind } from "./types";

/**
 * Display formatting for the API's figures. Rounding here is presentation only: the values sent
 * to the API and the ones it returns are never altered.
 */

/** Heat release rates run from hundreds of kW to tens of MW: whole kW is plenty. */
export function formatKw(value: number): string {
  return fixed(value, 0);
}

export function formatLength(value: number): string {
  return fixed(value, 2);
}

export function formatArea(value: number): string {
  return fixed(value, 2);
}

export function formatFlow(value: number): string {
  return fixed(value, 1);
}

export function formatTemperature(value: number): string {
  return fixed(value, 0);
}

/** Times to a tenth of a second are as fine as the correlations they come from. */
export function formatSeconds(value: number): string {
  return fixed(value, 1);
}

export function formatFactor(value: number): string {
  return fixed(value, 2);
}

/** Digits worth showing for each unit the checks come in. */
const CHECK_DIGITS: Record<string, number> = {
  kW: 0,
  K: 0,
  C: 1,
  s: 1,
  m: 2,
  m2: 2,
  "m/s": 2,
  "kW/m2": 1,
};

const UNIT_LABELS: Record<string, string> = {
  m2: "m²",
  "kW/m2": "kW/m²",
};

export function unitLabel(unit: string | null): string {
  if (!unit) return "";
  return UNIT_LABELS[unit] ?? unit;
}

export function formatCheckValue(value: number | null, unit: string | null): string {
  if (value === null) return "—";
  const text = fixed(value, unit ? (CHECK_DIGITS[unit] ?? 2) : 2);
  return unit ? `${text} ${unitLabel(unit)}` : text;
}

export const BASIS_LABELS: Record<CheckBasis, string> = {
  NFPA_204: "NFPA 204",
  SUPPLEMENTARY: "Not NFPA 204",
};

/** Under the clause of a line that is not a requirement of NFPA 204, so a report built from the table can't present it as one. */
export function supplementaryNote(check: ComplianceCheck): string | null {
  return check.basis === "SUPPLEMENTARY" ? BASIS_LABELS[check.basis] : null;
}

export const KIND_LABELS: Record<FireCaseKind, string> = {
  STEADY: "Steady fire (heat release rate known)",
  GROWING: "Growing t-squared fire",
};
