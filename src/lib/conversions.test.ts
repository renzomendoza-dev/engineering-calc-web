import { describe, expect, it } from "vitest";
import { LINEAR_CATEGORIES, convert, type LinearCategory } from "./conversions";

describe("convert", () => {
  it.each<[LinearCategory, number, string, string, number]>([
    ["length", 1, "ft", "m", 0.3048],
    ["length", 1, "in", "mm", 25.4],
    ["mass", 1, "lb", "kg", 0.45359237],
    ["power", 1, "HP", "kW", 0.745699872],
    ["pressure", 1, "psi", "kPa", 6.894757293168361],
    ["pressure", 1, "bar", "kPa", 100],
    ["pressure", 10, "mH2O", "kPa", 98.0665],
    ["flow", 100, "gpm", "Ls", 6.30901964],
    ["flow", 1, "Ls", "Lmin", 60],
    ["flow", 3600, "m3hr", "m3s", 1],
    ["speed", 1, "fts", "ms", 0.3048],
  ])("%s: %d %s -> %s", (category, value, fromUnit, toUnit, expected) => {
    expect(convert(category, value, fromUnit, toUnit)).toBeCloseTo(expected, 8);
  });

  it("is the identity for the same unit", () => {
    expect(convert("pressure", 42.5, "psi", "psi")).toBeCloseTo(42.5, 12);
  });

  it("round-trips every unit through every other unit in its category", () => {
    for (const [category, def] of Object.entries(LINEAR_CATEGORIES) as [LinearCategory, (typeof LINEAR_CATEGORIES)[LinearCategory]][]) {
      for (const from of def.units) {
        for (const to of def.units) {
          const there = convert(category, 123.456, from.unit, to.unit);
          expect(convert(category, there, to.unit, from.unit)).toBeCloseTo(123.456, 9);
        }
      }
    }
  });

  it("gives every category's base unit a toBase of exactly 1", () => {
    for (const def of Object.values(LINEAR_CATEGORIES)) {
      expect(def.units.find((u) => u.unit === def.baseUnit)?.toBase).toBe(1);
    }
  });

  it("throws on a unit that doesn't belong to the category", () => {
    expect(() => convert("length", 1, "psi", "m")).toThrow("Unknown unit for length: psi -> m");
    expect(() => convert("mass", 1, "kg", "stone")).toThrow(/Unknown unit/);
  });
});
