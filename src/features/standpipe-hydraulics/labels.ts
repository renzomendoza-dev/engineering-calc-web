import type {
  CombinedHazard,
  HoseConnectionSize,
  InletSize,
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

export const INLET_LABELS: Record<InletSize, string> = {
  TWO_AND_HALF_INCH: "2.5 in.",
  FOUR_INCH: "4 in.",
  FIVE_INCH: "5 in.",
};

export const INLET_OPTION_LABELS: Record<InletSize, string> = {
  TWO_AND_HALF_INCH: "2.5 in. inlet (250 gpm each)",
  FOUR_INCH: "4 in. inlet (500 gpm each)",
  FIVE_INCH: "5 in. inlet (750 gpm each)",
};

/** Said wherever the page shows the rules, because the rules were read from the 2024 edition. */
export const EDITION_NOTICE =
  "The rules and tables here follow the 2024 edition of NFPA 14 as printed (Chapters 5, 8, 10 and 11). The pressure of the other standpipes, the static pressure at the hose connections and the published friction loss of the hose valve are not covered, so confirm them separately, and check the class and type of system with the authority having jurisdiction.";

/** The tooltip of the C factor field on a segment and on a fire department connection's pipe. */
export const C_FACTOR_HINT =
  "Hazen-Williams C. 120 is black steel in wet service in the C table of NFPA 14 (Table 11.3.2.3); other pipe types are listed at the foot of the page. The AHJ may require another value.";
