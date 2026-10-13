/**
 * How the sprinklers listed in the network compare with the fewest the design area needs.
 *
 * Counts only: the plan's figure comes from the API and the listed count from the form, and this
 * says which way they differ. Nothing here is hydraulics.
 *
 * Neither direction makes the calculation invalid -- the API works out whatever is listed -- but
 * both make its demand something other than the design area's:
 *
 * - fewer than the plan, and the demand is for a smaller area of operation than declared. That is
 *   the unsafe direction: the supply is checked against a flow that is too low.
 * - more than the plan, and the demand is for a larger area. That is conservative, and may fail a
 *   supply that the design area would have passed, but it is not the area that was declared.
 */
export type PlanCountStatus = "fewer" | "match" | "more";

export function comparePlanCount(listed: number, planned: number): PlanCountStatus {
  if (listed < planned) return "fewer";
  if (listed > planned) return "more";
  return "match";
}

/**
 * The warning for listing more sprinklers than the plan calls for. Worded for the banner that is
 * shown on every step, so it says what happened, what it means for the figures, and what to do.
 */
export function moreThanPlanWarning(listed: number, planned: number): string {
  return (
    `You have listed ${listed} sprinklers, more than the ${planned} the design area needs. ` +
    "The calculation counts every one, so the demand is for a larger area of operation than the " +
    "design area — conservative, but not the area you declared. Remove the extras, or raise the " +
    "design area in step 1 if that is what you intend."
  );
}
