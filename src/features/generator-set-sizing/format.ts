/** Presentation only: groups thousands and rounds for display. The values themselves come from the API. */
export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString("en-US", { maximumFractionDigits });
}
