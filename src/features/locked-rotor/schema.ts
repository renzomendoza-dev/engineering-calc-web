import { z } from "zod";

/** Mirrors calc-api's LockedRotorRequest Bean Validation rules exactly. */
export const lockedRotorSchema = z.object({
  isPolyphase: z.boolean(),
  horsepowerLabel: z.string().min(1, "Horsepower is required"),
  voltage: z.coerce.number().positive("Must be positive"),
});

/** Pre-coercion shape react-hook-form edits (voltage comes in as a string). */
export type LockedRotorFormInput = z.input<typeof lockedRotorSchema>;

/** Post-coercion/validation shape handed to the submit handler. */
export type LockedRotorFormValues = z.output<typeof lockedRotorSchema>;
