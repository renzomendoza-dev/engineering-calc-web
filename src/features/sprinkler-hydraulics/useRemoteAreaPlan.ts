"use client";

import { useLiveApiResult, type LiveApiResultState } from "@/hooks/useLiveApiResult";
import { REMOTE_AREA_PLAN_PATH, buildRemoteAreaPlanPayload } from "./remoteAreaPlan";
import type { SprinklerFormInput } from "./schema";
import type { RemoteAreaPlanResponse } from "./types";

export type RemoteAreaPlanState = LiveApiResultState<RemoteAreaPlanResponse>;

/**
 * Works out the remote area plan on the API as the user edits, 400 ms after they stop. Every
 * figure shown comes from the response: the 1.2 x sqrt(area) dimension, the rounding up of the
 * counts, the reduction and the minimum operating pressure are all calc-core's, not the
 * browser's.
 */
export function useRemoteAreaPlan(
  values: SprinklerFormInput,
  maxCoverageSqFtPerSprinkler: number | null,
): RemoteAreaPlanState {
  return useLiveApiResult<RemoteAreaPlanResponse>(
    REMOTE_AREA_PLAN_PATH,
    buildRemoteAreaPlanPayload(values, maxCoverageSqFtPerSprinkler),
  );
}
