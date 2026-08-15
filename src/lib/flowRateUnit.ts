/**
 * Matches PipeUnitParsing's FLOW_RATE_UNITS keys exactly. Shared across every calculator that
 * takes a flow-rate input (pipe velocity, pipe pressure loss, pump TDH, pump power).
 */
export const FLOW_RATE_UNITS = ["L/s", "L/min", "m3/s", "m3/hr", "gpm"] as const;
