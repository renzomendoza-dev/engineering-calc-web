import type { StepId } from "./schema";

/**
 * How the API's "no supply" note begins. calc-core writes it when the request carries no water
 * supply (SprinklerHydraulicCalculator); it is the one warning this page treats differently, so it
 * is recognised by its opening words. The same words are asserted in calc-core's tests, which is
 * what keeps the two in step.
 */
export const NO_SUPPLY_WARNING_PREFIX = "No water supply given";

/**
 * The calculation's warnings that belong on `step`.
 *
 * The "no supply" note is about the comparison: with nothing to compare the demand against there is
 * no margin and no verdict. That is only meaningful where those figures are shown, the Results
 * step. Elsewhere it is noise (on the supply step it appears while the user is choosing "no supply",
 * which is a valid choice and is already explained on the page), so it is left to the Results step.
 * Every other warning is about something the user can act on wherever they are, and always shows.
 */
export function warningsForStep(warnings: readonly string[], step: StepId): string[] {
  if (step === "results") return [...warnings];
  return warnings.filter((warning) => !warning.startsWith(NO_SUPPLY_WARNING_PREFIX));
}
