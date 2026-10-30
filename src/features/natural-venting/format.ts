import type { CheckBasis, CheckStatus, FireCaseKind } from "./types";

/**
 * Display formatting for the API's figures. Rounding here is presentation only: the values sent
 * to the API and the ones it returns are never altered.
 */
function fixed(value: number, digits: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

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

export function formatFactor(value: number): string {
  return fixed(value, 2);
}

/** Digits worth showing for each unit the checks come in. */
const CHECK_DIGITS: Record<string, number> = {
  kW: 0,
  K: 0,
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

export const STATUS_LABELS: Record<CheckStatus, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  CONFIRM: "Confirm",
  OPEN: "Open",
  INFO: "Info",
};

export const BASIS_LABELS: Record<CheckBasis, string> = {
  NFPA_204: "NFPA 204",
  SUPPLEMENTARY: "Not NFPA 204",
};

export const KIND_LABELS: Record<FireCaseKind, string> = {
  STEADY: "Steady fire (heat release rate known)",
  GROWING: "Growing t-squared fire",
};
