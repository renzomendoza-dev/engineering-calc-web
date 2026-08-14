/**
 * Citation info for the Philippine Electrical Code tables backing calc-core's conductor
 * reference data (calc-core/src/main/java/com/renzoproject/calc/core/electrical/reference/).
 * Shared across calculators that pull from PEC Part 1 tables — not voltage-drop specific.
 */
export const PEC_CITATION = {
  bookTitle: "Philippine Electrical Code (PEC) Part 1",
  edition: "2017 Edition",
  publisher: "Institute of Integrated Electrical Engineers of the Philippines, Inc.",
};

/**
 * `page` is omitted for tables whose printed page number hasn't been confirmed yet (only
 * DC_RESISTANCE/AC_RESISTANCE_REACTANCE have been checked against the actual book so far) —
 * consumers should render the page parenthetical only when it's present, not fabricate one.
 */
export const PEC_TABLES = {
  DC_RESISTANCE: {
    number: "10.1.1.8",
    title: "Conductor Properties",
    page: 941,
  },
  AC_RESISTANCE_REACTANCE: {
    number: "10.1.1.9",
    title:
      "Alternating-Current Resistance and Reactance for 600-Volt Cables, 3-Phase, 60 Hz, 75°C — Three Single Conductors in Conduit",
    page: 942,
  },
  FILL_PERCENTAGE: {
    number: "10.1.1.1",
    title: "Percent of Cross Section of Conduit and Tubing for Conductors",
  },
  CONDUIT_DIMENSIONS: {
    number: "10.1.1.4",
    title: "Dimensions and Percent Area of Conduit and Tubing",
  },
  CONDUCTOR_DIMENSIONS: {
    number: "10.1.1.5",
    title: "Dimensions of Insulated Conductors and Fixture Wires",
  },
  /**
   * calc-core's MotorFlcTable merges all four of these into one combined lookup/endpoint,
   * but the frontend splits the display back out per phase type (see MotorFlcReference) —
   * so unlike that merged endpoint, citations here are one per PEC table number.
   */
  MOTOR_FLC_DC: {
    number: "4.30.14.1",
    title: "Full-Load Current — DC Motors",
  },
  MOTOR_FLC_SINGLE_PHASE: {
    number: "4.30.14.2",
    title: "Full-Load Current — Single-Phase AC Motors",
  },
  MOTOR_FLC_TWO_PHASE: {
    number: "4.30.14.3",
    title: "Full-Load Current — Two-Phase AC Motors",
  },
  MOTOR_FLC_THREE_PHASE: {
    number: "4.30.14.4",
    title: "Full-Load Current — Three-Phase AC Motors",
  },
  LOCKED_ROTOR_SINGLE_PHASE: {
    number: "4.30.14.5(A)",
    title: "Locked-Rotor Current — Single-Phase Motors",
  },
  LOCKED_ROTOR_POLYPHASE: {
    number: "4.30.14.5(B)",
    title: "Locked-Rotor Current — Polyphase Motors (Design B, C, D)",
  },
} as const;
