/**
 * Display formatting for the API's figures. Rounding here is presentation only — the values sent
 * to the API and the ones it returns are never altered, and nothing in this feature derives a
 * number from another.
 */
function fixed(value: number, digits: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** gpm, to one decimal: a tenth of a gallon per minute is already below measurement precision. */
export function formatFlow(value: number): string {
  return fixed(value, 1);
}

/** psi, to two decimals — the precision hydraulic calculation sheets are normally signed off at. */
export function formatPressure(value: number): string {
  return fixed(value, 2);
}

export function formatPercent(value: number): string {
  return fixed(value, 1);
}

export function formatLength(value: number): string {
  return fixed(value, 2);
}

export function formatVelocity(value: number): string {
  return fixed(value, 2);
}

/** Inside diameters are published to three decimals of an inch. */
export function formatDiameter(value: number): string {
  return fixed(value, 3);
}

/** psi per foot is a small number: four decimals keeps it meaningful on small pipe. */
export function formatFrictionRate(value: number): string {
  return fixed(value, 4);
}

/** C factors and quantities are whole numbers in practice, but don't have to be. */
export function formatPlain(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
