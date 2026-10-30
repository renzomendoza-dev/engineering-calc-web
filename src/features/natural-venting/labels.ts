/**
 * The defaults calc-core applies when an assumption is left blank. Shown as placeholders only:
 * the form sends nothing for a blank field, so the API's own values apply and these can never
 * drift into the request.
 */
export const NaturalVentingInputDefaults = {
  growthConstant: 1055,
  layerEnergyFraction: 0.5,
  specificHeat: 1.0,
} as const;

/** Table 9.2.4.2: the discharge coefficients to use when the manufacturer gives none. */
export const DISCHARGE_COEFFICIENT_HINT =
  "Manufacturer's value, or Table 9.2.4.2: 0.55 louvers at 90° to the airflow and flap or drop-out vents open at least 55°; 0.35 flap vents open at least 30°; 0.25 fixed weather louvers at 45°. Annex A.9.2.4.2 suggests 0.6 for most vents and doors that open at least 45°.";
