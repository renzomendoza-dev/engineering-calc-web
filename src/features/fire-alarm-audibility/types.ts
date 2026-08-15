/**
 * Mirrors calc-api's FireAlarmNotificationMode enum
 * (calc-api/src/main/java/com/renzoproject/calc_api/acoustics/FireAlarmNotificationMode.java).
 */
export const FIRE_ALARM_NOTIFICATION_MODES = ["PUBLIC", "PRIVATE", "SLEEPING"] as const;

export type FireAlarmNotificationMode = (typeof FIRE_ALARM_NOTIFICATION_MODES)[number];

/**
 * Mirrors calc-api's GoverningAudibilityRuleDto enum.
 */
export type GoverningAudibilityRule =
  | "AVERAGE_AMBIENT_PLUS_OFFSET"
  | "MAX_SUSTAINED_PLUS_OFFSET"
  | "ABSOLUTE_SLEEPING_FLOOR";

/**
 * Mirrors calc-api's AudibilityOutcomeDto enum. FAIL and EXCEEDS_MAX_LIMIT are both ordinary
 * 200 responses, not error states — a fire alarm failing audibility or exceeding the system-
 * wide safety ceiling is a valid calculation outcome.
 */
export type AudibilityOutcome = "PASS" | "FAIL" | "EXCEEDS_MAX_LIMIT";

/**
 * Mirrors calc-api's FireAlarmAudibilityRequest field-for-field. All three modes share this
 * same shape (a flat DTO with a `mode` discriminator) — only the backend's threshold rule
 * changes per mode, not the request fields. measuredMaxSustainedAmbientDb is genuinely
 * optional: the 60-second-max measurement window isn't always available on-site, in which
 * case only the average-ambient candidate is evaluated.
 */
export interface FireAlarmAudibilityRequest {
  mode: FireAlarmNotificationMode;
  applianceSplAtReferenceDb: number;
  referenceDistanceMeters: number;
  targetDistanceMeters: number;
  measuredAverageAmbientDb: number;
  measuredMaxSustainedAmbientDb: number | null;
}

/**
 * Mirrors calc-api's FireAlarmAudibilityResponse field-for-field. Doesn't echo request
 * inputs (same convention as every other calc-api response DTO), so the results panel gets
 * the submitted request passed alongside this for display.
 */
export interface FireAlarmAudibilityResponse {
  calculatedTargetSplDb: number;
  requiredThresholdDb: number;
  governingRule: GoverningAudibilityRule;
  outcome: AudibilityOutcome;
}
