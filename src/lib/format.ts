/**
 * A figure to a fixed number of decimals, grouped the way the browser's locale groups thousands.
 * Display only: the values sent to the API and the ones it returns are never altered.
 */
export function formatFixed(value: number, digits: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
