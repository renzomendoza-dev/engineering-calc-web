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

/** gpm to one decimal. */
export function formatFlow(value: number): string {
  return fixed(value, 1);
}

/** psi to two decimals, the precision hydraulic calculation sheets are signed off at. */
export function formatPressure(value: number): string {
  return fixed(value, 2);
}

export function formatLength(value: number): string {
  return fixed(value, 2);
}

export function formatVelocity(value: number): string {
  return fixed(value, 2);
}

export function formatDiameter(value: number): string {
  return fixed(value, 3);
}

/** psi per foot is small: four decimals keeps it meaningful. */
export function formatFrictionRate(value: number): string {
  return fixed(value, 4);
}

export function formatVolume(value: number): string {
  return fixed(value, 0);
}

const CHECK_DIGITS: Record<string, number> = { gpm: 0, psi: 1, in: 1, min: 0, inlets: 0 };

export function formatCheckValue(value: number | null, unit: string | null): string {
  if (value === null) return "—";
  const text = fixed(value, unit ? (CHECK_DIGITS[unit] ?? 1) : 1);
  return unit ? `${text} ${unit}` : text;
}
