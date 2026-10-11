import { z } from "zod";
import { optionalNumber } from "@/lib/zodHelpers";
import type { SprinklerFormInput } from "./schema";
import type { RemoteAreaPlanRequest } from "./types";

export const REMOTE_AREA_PLAN_PATH = "/api/mechanical/sprinkler/remote-area";

/**
 * Only the figures the plan reads. Deliberately separate from sprinklerHydraulicsSchema: the plan
 * is worked out before the pipe network exists, so it must not wait on -- or be blocked by -- a
 * network, a water supply or anything else that isn't entered yet. zod strips every other key, so
 * the whole form can be handed to it.
 *
 * Reads the design area and density from step 1 and the default K factor from step 2, which is
 * the K new sprinklers start from.
 */
const planInputSchema = z
  .object({
    designAreaSqFt: z.coerce.number().positive(),
    densityGpmPerSqFt: z.coerce.number().positive(),
    defaultKFactor: z.coerce.number().positive(),
    sprinklerSpacingFt: z.coerce.number().positive(),
    branchSpacingFt: z.coerce.number().positive(),
    quickResponseSprinklers: z.boolean(),
    ceilingHeightFt: optionalNumber(z.coerce.number().positive()),
  })
  .refine((data) => !data.quickResponseSprinklers || data.ceilingHeightFt !== undefined, {
    // The reduction is read against the ceiling, so quick-response with no height is unanswerable.
    path: ["ceilingHeightFt"],
    message: "Required for the quick-response reduction",
  });

/**
 * The plan request for the current form state, as JSON, or null when the plan can't be worked out
 * yet. Null never calls the API.
 *
 * `maxCoverageSqFtPerSprinkler` is the hazard preset's published maximum, or null while the preset
 * table hasn't loaded -- in which case spacing simply isn't checked against it.
 */
export function buildRemoteAreaPlanPayload(
  values: SprinklerFormInput,
  maxCoverageSqFtPerSprinkler: number | null,
): string | null {
  const parsed = planInputSchema.safeParse(values);
  if (!parsed.success) return null;

  const { data } = parsed;
  const request: RemoteAreaPlanRequest = {
    designAreaSqFt: data.designAreaSqFt,
    densityGpmPerSqFt: data.densityGpmPerSqFt,
    kFactor: data.defaultKFactor,
    sprinklerSpacingFt: data.sprinklerSpacingFt,
    branchSpacingFt: data.branchSpacingFt,
    quickResponseSprinklers: data.quickResponseSprinklers,
    // Sent only when it is used: the API ignores it otherwise, and a leftover figure from before
    // quick-response was unticked shouldn't travel with the request.
    ceilingHeightFt: data.quickResponseSprinklers ? (data.ceilingHeightFt ?? null) : null,
    maxCoveragePerSprinklerSqFt: maxCoverageSqFtPerSprinkler,
  };
  return JSON.stringify(request);
}
