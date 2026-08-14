export type LinearCategory = "length" | "mass" | "power" | "pressure" | "flow" | "speed";

interface UnitDef {
  unit: string;
  label: string;
  /** Multiplier to convert 1 of this unit into the category's base unit. */
  toBase: number;
}

interface CategoryDef {
  label: string;
  baseUnit: string;
  units: UnitDef[];
}

/**
 * Every unit converts through its category's base unit (base = value * toBase,
 * target = base / toBase) instead of pairwise formulas, so adding a unit later
 * is one table entry rather than N new conversions.
 */
export const LINEAR_CATEGORIES: Record<LinearCategory, CategoryDef> = {
  length: {
    label: "Length",
    baseUnit: "m",
    units: [
      { unit: "m", label: "m", toBase: 1 },
      { unit: "ft", label: "ft", toBase: 0.3048 },
      { unit: "mm", label: "mm", toBase: 0.001 },
      { unit: "in", label: "in", toBase: 0.0254 },
    ],
  },
  mass: {
    label: "Mass",
    baseUnit: "kg",
    units: [
      { unit: "kg", label: "kg", toBase: 1 },
      { unit: "lb", label: "lb", toBase: 0.45359237 },
    ],
  },
  power: {
    label: "Power",
    baseUnit: "kW",
    units: [
      { unit: "kW", label: "kW", toBase: 1 },
      { unit: "HP", label: "HP", toBase: 0.745699872 },
    ],
  },
  pressure: {
    label: "Pressure",
    baseUnit: "kPa",
    units: [
      { unit: "kPa", label: "kPa", toBase: 1 },
      { unit: "psi", label: "psi", toBase: 6.894757293168361 },
      { unit: "bar", label: "bar", toBase: 100 },
      { unit: "mH2O", label: "m H₂O", toBase: 9.80665 },
    ],
  },
  flow: {
    label: "Flow Rate",
    baseUnit: "m3s",
    units: [
      { unit: "gpm", label: "gpm", toBase: 0.003785411784 / 60 },
      { unit: "cfm", label: "cfm", toBase: 0.028316846592 / 60 },
      { unit: "Ls", label: "L/s", toBase: 0.001 },
      { unit: "Lmin", label: "L/min", toBase: 0.001 / 60 },
      { unit: "m3hr", label: "m³/hr", toBase: 1 / 3600 },
      { unit: "m3s", label: "m³/s", toBase: 1 },
    ],
  },
  speed: {
    label: "Speed",
    baseUnit: "ms",
    units: [
      { unit: "ms", label: "m/s", toBase: 1 },
      { unit: "fts", label: "ft/s", toBase: 0.3048 },
    ],
  },
};

export function convert(
  category: LinearCategory,
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  const { units } = LINEAR_CATEGORIES[category];
  const from = units.find((u) => u.unit === fromUnit);
  const to = units.find((u) => u.unit === toUnit);
  if (!from || !to) {
    throw new Error(`Unknown unit for ${category}: ${fromUnit} -> ${toUnit}`);
  }
  const base = value * from.toBase;
  return base / to.toBase;
}
