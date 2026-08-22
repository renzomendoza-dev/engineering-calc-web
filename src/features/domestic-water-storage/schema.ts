import { z } from "zod";
import { SYSTEM_TYPES } from "./types";

/**
 * "By occupant count" mode (OCCUPANT_LOAD). safetyMarginPercent defaults to a real 0 (not
 * left blank for the backend to fill in) — the task's "optional, default 0" is a UI default,
 * not a backend-resolved fallback like wire sizing's optional fractions, so no
 * blank-string-to-undefined handling is needed here.
 */
export const occupantLoadSchema = z.object({
  occupantCount: z.coerce.number().int("Must be a whole number").positive("Must be positive"),
  occupancyType: z.string().min(1, "Occupancy type is required"),
  storageDurationHours: z.coerce.number().positive("Must be positive"),
  safetyMarginPercent: z.coerce.number().min(0, "Cannot be negative"),
});

export type OccupantLoadFormInput = z.input<typeof occupantLoadSchema>;
export type OccupantLoadFormValues = z.output<typeof occupantLoadSchema>;

/** "By fixture units" mode (FIXTURE_UNIT). */
export const fixtureUnitSchema = z.object({
  totalFixtureUnits: z.coerce.number().positive("Must be positive"),
  systemType: z.enum(SYSTEM_TYPES, "System type is required"),
  storageDurationHours: z.coerce.number().positive("Must be positive"),
  safetyMarginPercent: z.coerce.number().min(0, "Cannot be negative"),
});

export type FixtureUnitFormInput = z.input<typeof fixtureUnitSchema>;
export type FixtureUnitFormValues = z.output<typeof fixtureUnitSchema>;
