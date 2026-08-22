/** Mirrors calc-api's DemandBasisDto enum. */
export const DEMAND_BASES = ["OCCUPANT_LOAD", "FIXTURE_UNIT"] as const;
export type DemandBasis = (typeof DEMAND_BASES)[number];

/**
 * Mirrors calc-core's reference/storage/lpcd-consumption.json occupancyType keys exactly
 * (confirmed from source — the actual file has 9 entries, including a low-income residential
 * split that isn't obvious from the calculator's concept alone). No reference endpoint
 * exposes this list (see DomesticWaterStorageRequest's Javadoc — deliberately out of scope
 * at the API layer), so it's a client-side constant.
 *
 * Every entry in that JSON is "confidence": "placeholder" — generic international rule-of-
 * thumb figures, not sourced from a confirmed Philippine code. See OccupantLoadForm's caveat
 * note, which is NOT conditional per entry (unlike pipe velocity's per-material confidence
 * flag) since this applies uniformly to the whole table.
 */
export const OCCUPANCY_TYPES = [
  { value: "RESIDENTIAL_DWELLING", label: "Residential (dwelling unit)" },
  { value: "RESIDENTIAL_LOW_INCOME", label: "Residential (low-income / minimal fixture provision)" },
  { value: "OFFICE_COMMERCIAL", label: "Office / commercial (employee use)" },
  { value: "SCHOOL_DAY", label: "School (day students, no boarding/showering)" },
  { value: "SCHOOL_BOARDING", label: "School (boarding/dormitory)" },
  { value: "HOSPITAL", label: "Hospital (per bed)" },
  { value: "HOTEL", label: "Hotel (per guest)" },
  { value: "INDUSTRIAL_FACTORY", label: "Industrial / factory (per worker, no process water)" },
  { value: "RESTAURANT_ASSEMBLY", label: "Restaurant / assembly (per person, transient use)" },
] as const;

/** Mirrors calc-api's SystemTypeDto enum. */
export const SYSTEM_TYPES = ["FLUSH_TANK", "FLUSH_VALVE"] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number];

/**
 * Mirrors calc-api's DomesticWaterStorageRequest field-for-field — one flat shape covering
 * both demand-basis modes, same discriminator pattern as PipeVelocityRequest. Only the
 * fields relevant to the selected demandBasis are populated; the rest are null.
 */
export interface DomesticWaterStorageRequest {
  demandBasis: DemandBasis;
  occupantCount: number | null;
  occupancyType: string | null;
  totalFixtureUnits: number | null;
  systemType: SystemType | null;
  storageDurationHours: number;
  safetyMarginPercent: number;
}

/**
 * Mirrors calc-api's DomesticWaterStorageResponse field-for-field. SI units (L/s, m3) —
 * matches this endpoint's convention, unlike Fire Water Storage's GPM/gallons.
 */
export interface DomesticWaterStorageResponse {
  resolvedDemandFlowRateLps: number;
  requiredStorageVolumeM3: number;
}

/**
 * Mirrors calc-api's OccupancyTypeEntryDto field-for-field — one row of
 * reference/storage/lpcd-consumption.json, backing OCCUPANT_LOAD mode.
 */
export interface OccupancyTypeTableRow {
  type: string;
  label: string;
  lpcd: number;
}

/**
 * Mirrors calc-api's WsfuDemandEntryDto field-for-field — one row of
 * reference/storage/wsfu-demand.json, backing FIXTURE_UNIT mode. gpmFlushValves is nullable
 * (no published data below WSFU=5).
 */
export interface WsfuDemandTableRow {
  wsfu: number;
  gpmFlushTanks: number;
  gpmFlushValves: number | null;
}
