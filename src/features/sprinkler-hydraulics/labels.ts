import type { SprinklerHazard, SprinklerSystemType } from "./types";

/**
 * Human-readable text for every enum this feature shows. Raw codes (WET, ORDINARY_GROUP_1,
 * ELBOW_90_STANDARD) never reach the screen.
 *
 * The hazard and fitting reference tables publish their own `label`, which wins when the table has
 * loaded; these maps are the fallback so a dropdown still reads properly before the fetch resolves
 * or if it fails.
 */
export const SYSTEM_TYPE_LABELS: Record<SprinklerSystemType, string> = {
  WET: "Wet pipe",
  DRY: "Dry pipe",
  PREACTION: "Preaction",
};

export const HAZARD_LABELS: Record<SprinklerHazard, string> = {
  LIGHT: "Light Hazard",
  ORDINARY_GROUP_1: "Ordinary Hazard Group 1",
  ORDINARY_GROUP_2: "Ordinary Hazard Group 2",
  EXTRA_GROUP_1: "Extra Hazard Group 1",
  EXTRA_GROUP_2: "Extra Hazard Group 2",
};

/** Reference-data confidence flags, surfaced so a designer knows what to double-check. */
export const CONFIDENCE_LABELS: Record<string, string> = {
  verified: "Verified against the published standard",
  verify: "Not yet verified against the printed standard",
  placeholder: "Placeholder data — no published values entered yet",
};

/** Turns an unmapped backend code into something readable rather than showing it raw. */
export function humanizeCode(code: string): string {
  const words = code.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const UNITS = {
  flow: "gpm",
  pressure: "psi",
  length: "ft",
  diameter: "in",
  velocity: "fps",
  area: "ft²",
  density: "gpm/ft²",
  duration: "min",
} as const;
