import type {
  CheckStatus,
  CombinedHazard,
  HoseConnectionSize,
  PipeRole,
  SprinklerProtection,
  StandpipeClass,
} from "./types";

export const CLASS_LABELS: Record<StandpipeClass, string> = {
  CLASS_I: "Class I: 2.5 in. hose connections for the fire department",
  CLASS_II: "Class II: 1.5 in. hose stations for trained personnel",
  CLASS_III: "Class III: both 1.5 in. hose stations and 2.5 in. connections",
};

export const PROTECTION_LABELS: Record<SprinklerProtection, string> = {
  NONE: "No sprinklers",
  FULL: "Sprinklered throughout (NFPA 13)",
  PARTIAL: "Partly sprinklered",
};

export const HAZARD_LABELS: Record<CombinedHazard, string> = {
  LIGHT: "Light hazard",
  ORDINARY: "Ordinary hazard",
};

export const ROLE_LABELS: Record<PipeRole, string> = {
  HOSE_PIPING: "Hose valve to standpipe",
  STANDPIPE: "Standpipe",
  BRANCH_LINE: "Branch line",
  OTHER: "Supply piping or other",
};

export const CONNECTION_LABELS: Record<HoseConnectionSize, string> = {
  ONE_AND_HALF_INCH: "1.5 in. hose connection",
  TWO_AND_HALF_INCH: "2.5 in. hose connection",
};

export const STATUS_LABELS: Record<CheckStatus, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  CONFIRM: "Confirm",
  OPEN: "Open",
  INFO: "Info",
};

/** Said wherever the page shows the rules, because the rules were read from the 2024 edition. */
export const EDITION_NOTICE =
  "The rules and tables here follow the 2024 edition of NFPA 14 as printed (Chapters 5, 8, 10 and 11). The pressure of the other standpipes, the static pressure at the hose connections and the published friction loss of the hose valve are not covered, so confirm them separately, and check the class and type of system with the authority having jurisdiction.";
