import { z } from "zod";

/**
 * Mirrors the backend's Bean Validation rules exactly (ConduitFillRequest,
 * ConductorFillEntryDto in calc-api), so the client rejects the same inputs the server
 * would. insulationType/sizeLabel/conduitType are validated as non-empty strings here —
 * they're free-text-looking but actually constrained to whatever
 * useConduitFillReferenceData/useConductorFillSizes fetched, since the form only ever
 * offers those values as select options.
 */
const conductorFillEntrySchema = z.object({
  insulationType: z.string().min(1, "Insulation type is required"),
  sizeLabel: z.string().min(1, "Conductor size is required"),
  quantity: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
});

export const conduitFillSchema = z.object({
  conductors: z.array(conductorFillEntrySchema).min(1, "At least one conductor is required"),
  conduitType: z.string().min(1, "Conduit type is required"),
});

/** Pre-coercion shape react-hook-form edits (quantity comes in as a string). */
export type ConduitFillFormInput = z.input<typeof conduitFillSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type ConduitFillFormValues = z.output<typeof conduitFillSchema>;
