import { z } from "zod";

/**
 * Mirrors calc-api's DiameterSpecTypeDto enum — the exact same discriminated shape used by
 * both PipeVelocityRequest and PipePressureLossRequest, per those DTOs' Javadoc.
 */
export const DIAMETER_SPEC_TYPES = ["NOMINAL", "RAW"] as const;
export type DiameterSpecType = (typeof DIAMETER_SPEC_TYPES)[number];

/** UI-only concept (not sent to the API) that maps to diameterSpecType: standard -> NOMINAL, custom -> RAW. */
export const DIAMETER_SOURCES = ["standard", "custom"] as const;
export type DiameterSource = (typeof DIAMETER_SOURCES)[number];

/** Matches PipeUnitParsing's LENGTH_UNITS keys — subset offered for raw diameter entry. */
export const RAW_DIAMETER_UNITS = ["mm", "in"] as const;

/**
 * Shared field shape for the standard-size/custom-diameter spec, spread into any parent zod
 * object schema that embeds a DiameterSpecInput. The fields for whichever side isn't selected
 * are `.optional()` since DiameterSpecInput unmounts them rather than just disabling — same
 * "unmounted fields don't get silently submitted" reasoning used throughout this codebase.
 */
export const diameterSpecFields = {
  diameterSource: z.enum(DIAMETER_SOURCES),
  nominalMaterial: z.string().optional(),
  nominalSchedule: z.string().optional(),
  nominalSize: z.string().optional(),
  rawDiameterValue: z.coerce.number().optional(),
  rawDiameterUnit: z.enum(RAW_DIAMETER_UNITS).optional(),
};

interface DiameterSpecFormData {
  diameterSource: DiameterSource;
  nominalMaterial?: string;
  nominalSize?: string;
  rawDiameterValue?: number;
  rawDiameterUnit?: string;
}

/**
 * Call from a parent schema's `.superRefine()` to validate the diameter-spec sub-fields
 * (`data` just needs to include the `diameterSpecFields` keys above alongside its own).
 */
export function validateDiameterSpec(data: DiameterSpecFormData, ctx: z.RefinementCtx): void {
  if (data.diameterSource === "standard") {
    if (!data.nominalMaterial) {
      ctx.addIssue({ code: "custom", path: ["nominalMaterial"], message: "Material is required" });
    }
    if (!data.nominalSize) {
      ctx.addIssue({ code: "custom", path: ["nominalSize"], message: "Pipe size is required" });
    }
  } else {
    if (data.rawDiameterValue === undefined || data.rawDiameterValue <= 0) {
      ctx.addIssue({ code: "custom", path: ["rawDiameterValue"], message: "Must be positive" });
    }
    if (!data.rawDiameterUnit) {
      ctx.addIssue({ code: "custom", path: ["rawDiameterUnit"], message: "Unit is required" });
    }
  }
}
