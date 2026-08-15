import { z } from "zod";
import { FIRE_ALARM_NOTIFICATION_MODES } from "./types";

/**
 * Mirrors calc-api's FireAlarmAudibilityRequest Bean Validation constraints exactly. A flat
 * schema, not a discriminated union — the DTO's own Javadoc confirms all three modes share
 * an identical field shape, so no field's presence depends on `mode`. measuredMaxSustainedAmbientDb
 * has no `@NotNull` on the backend, so it stays optional here too.
 *
 * That field is always mounted (unlike other features' mode-conditional optional fields,
 * which stay unregistered and thus simply absent from the submitted values when hidden), so
 * a user leaving it blank submits `""` rather than `undefined`. z.coerce.number() would
 * coerce `""` to `0` before `.optional()` ever sees it, silently turning "unmeasured" into
 * "measured at 0 dB" — the preprocess step strips the blank string first so it reaches
 * `.optional()` as `undefined`.
 */
export const fireAlarmAudibilitySchema = z.object({
  mode: z.enum(FIRE_ALARM_NOTIFICATION_MODES, "Mode is required"),
  applianceSplAtReferenceDb: z.coerce.number().min(0, "Cannot be negative"),
  referenceDistanceMeters: z.coerce.number().positive("Must be positive"),
  targetDistanceMeters: z.coerce.number().positive("Must be positive"),
  measuredAverageAmbientDb: z.coerce.number().min(0, "Cannot be negative"),
  measuredMaxSustainedAmbientDb: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().min(0, "Cannot be negative").optional(),
  ),
});

export type FireAlarmAudibilityFormInput = z.input<typeof fireAlarmAudibilitySchema>;
export type FireAlarmAudibilityFormValues = z.output<typeof fireAlarmAudibilitySchema>;
