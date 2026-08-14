/** Mirrors calc-api's LockedRotorRequest field-for-field. */
export interface LockedRotorRequest {
  isPolyphase: boolean;
  horsepowerLabel: string;
  voltage: number;
}

/** Mirrors calc-api's LockedRotorResponse field-for-field. */
export interface LockedRotorResponse {
  lockedRotorAmps: number;
}

/**
 * Mirrors calc-api's LockedRotorEntryDto field-for-field — one row of either PEC Table
 * 4.30.14.5(A) (single-phase) or 4.30.14.5(B) (polyphase) locked-rotor current tables, as
 * published. Shared shape for both; which table a row came from is determined by which
 * endpoint fetched it, not by a field on the row itself.
 */
export interface LockedRotorTableRow {
  sizeLabel: string;
  voltage: number;
  lockedRotorAmps: number;
}
