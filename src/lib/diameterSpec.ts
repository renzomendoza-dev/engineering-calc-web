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
  nominalSchedule?: string;
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

/** The DiameterSpec discriminated shape every API request that embeds one expects. */
export interface DiameterSpecRequestFields {
  diameterSpecType: DiameterSpecType;
  nominalMaterial: string | null;
  nominalSchedule: string | null;
  nominalLabel: string | null;
  rawDiameterValue: number | null;
  rawDiameterUnit: string | null;
}

/**
 * Converts a DiameterSpecInput form's fields into the API's DiameterSpec discriminated shape.
 * Shared by every request builder that embeds a diameter spec (pipe velocity, pipe pressure
 * loss, and each pump TDH pipe segment) so the nominalSize-becomes-nominalLabel mapping (see
 * NominalSize's Javadoc in calc-core) is written once, not once per caller.
 */
export function toDiameterSpecRequest(data: DiameterSpecFormData): DiameterSpecRequestFields {
  if (data.diameterSource === "standard") {
    return {
      diameterSpecType: "NOMINAL",
      nominalMaterial: data.nominalMaterial || null,
      nominalSchedule: data.nominalSchedule || null,
      nominalLabel: data.nominalSize || null,
      rawDiameterValue: null,
      rawDiameterUnit: null,
    };
  }
  return {
    diameterSpecType: "RAW",
    nominalMaterial: null,
    nominalSchedule: null,
    nominalLabel: null,
    rawDiameterValue: data.rawDiameterValue ?? null,
    rawDiameterUnit: data.rawDiameterUnit || null,
  };
}
