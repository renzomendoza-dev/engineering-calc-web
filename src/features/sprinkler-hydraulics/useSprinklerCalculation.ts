"use client";

import { useLiveApiResult, type LiveApiResultState } from "@/hooks/useLiveApiResult";
import { isIdenticalBranch } from "./network";
import { toSprinklerRequest, unresolvedFittingPaths } from "./request";
import { sprinklerHydraulicsSchema, type SprinklerFormInput } from "./schema";
import type { FittingEquivalentLengthTableRow, SprinklerHydraulicResponse } from "./types";

export const SPRINKLER_HYDRAULICS_PATH = "/api/mechanical/sprinkler/hydraulics";

/** The live calculation's state: see useLiveApiResult for what each field means. */
export type SprinklerCalculationState = LiveApiResultState<SprinklerHydraulicResponse>;

/**
 * The request body for the current form state, as JSON, or null when it isn't sendable yet.
 * A string rather than an object so identical input produces an identical value — that's what
 * keeps the debounce from restarting, and the request from repeating, on every keystroke that
 * doesn't actually change the payload.
 */
function buildPayload(
  values: SprinklerFormInput,
  fittings: FittingEquivalentLengthTableRow[],
): string | null {
  const parsed = sprinklerHydraulicsSchema.safeParse(values);
  if (!parsed.success) return null;
  // A fitting with no published length and no typed-in length would be rejected by the API.
  if (unresolvedFittingPaths(parsed.data, fittings).length > 0) return null;
  return JSON.stringify(toSprinklerRequest(parsed.data));
}

/**
 * Shown when branches are declared identical but the API that answered does not know the
 * concept. Such an API accepts the request and quietly leaves those branches out, so the demand
 * it reports is too low and nothing in the figures says so -- hence a warning, and not just a
 * missing table. The response of an API that does support them always carries the list, even
 * when it is empty.
 */
export const OLD_API_IDENTICAL_BRANCHES_WARNING =
  "The calculation service answered without supporting identical branches, so the branches you " +
  "declared identical are not in the demand below and it is understated. Update the service " +
  "before relying on this result.";

/** The result, with the old-service warning put first when it applies. Pure, so it can be tested. */
export function withIdenticalBranchNotice(
  result: SprinklerHydraulicResponse,
  declaresCopies: boolean,
): SprinklerHydraulicResponse {
  if (!declaresCopies || result.identicalBranches !== undefined) return result;
  return { ...result, warnings: [OLD_API_IDENTICAL_BRANCHES_WARNING, ...result.warnings] };
}

/**
 * Runs the hydraulic calculation on the API as the user edits, 400 ms after they stop.
 *
 * Every number the UI shows comes from the response -- nothing here recomputes flow, friction,
 * pressure or margin. Requests are only sent for input that passes the whole schema, so an
 * incomplete form never calls the endpoint. Debouncing, cancelling a superseded request and
 * dropping stale replies are useLiveApiResult's job.
 */
export function useSprinklerCalculation(
  values: SprinklerFormInput,
  fittings: FittingEquivalentLengthTableRow[],
): SprinklerCalculationState {
  const state = useLiveApiResult<SprinklerHydraulicResponse>(
    SPRINKLER_HYDRAULICS_PATH,
    buildPayload(values, fittings),
  );

  if (!state.result) return state;
  const declaresCopies = (values.network?.branches ?? []).some(isIdenticalBranch);
  return { ...state, result: withIdenticalBranchNotice(state.result, declaresCopies) };
}
