"use client";

import { useEffect, useState } from "react";
import { ConversionField, type ConversionFieldOption } from "./ConversionField";
import { LINEAR_CATEGORIES, convert, type LinearCategory } from "@/lib/conversions";
import { WIRE_SIZE_TABLE, awgToMm2, nearestAwgForMm2 } from "@/lib/wireSize";

// "speed" is excluded here — it exists in conversions.ts for the pipe velocity calculator's
// result-unit toggle, but isn't (yet) one of this FAB's categories.
type SheetCategory = Exclude<LinearCategory, "speed"> | "wireSize";

const CATEGORY_TABS: { id: SheetCategory; label: string }[] = [
  { id: "length", label: "Length" },
  { id: "mass", label: "Mass" },
  { id: "power", label: "Power" },
  { id: "pressure", label: "Pressure" },
  { id: "flow", label: "Flow Rate" },
  { id: "wireSize", label: "Wire Size" },
];

const CATEGORY_DEFAULTS: Record<SheetCategory, { fromUnit: string; toUnit: string }> = {
  length: { fromUnit: "m", toUnit: "ft" },
  mass: { fromUnit: "kg", toUnit: "lb" },
  power: { fromUnit: "kW", toUnit: "HP" },
  pressure: { fromUnit: "kPa", toUnit: "psi" },
  flow: { fromUnit: "gpm", toUnit: "Ls" },
  wireSize: { fromUnit: "AWG", toUnit: "mm2" },
};

const WIRE_SIZE_UNIT_OPTIONS: ConversionFieldOption[] = [
  { value: "AWG", label: "AWG" },
  { value: "mm2", label: "mm²" },
];

const WIRE_SIZE_VALUE_OPTIONS: ConversionFieldOption[] = WIRE_SIZE_TABLE.map((entry) => ({
  value: entry.awg,
  label: `${entry.awg} AWG`,
}));

function unitOptionsFor(category: SheetCategory): ConversionFieldOption[] {
  if (category === "wireSize") return WIRE_SIZE_UNIT_OPTIONS;
  return LINEAR_CATEGORIES[category].units.map((u) => ({ value: u.unit, label: u.label }));
}

function formatResult(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function isAwgSelect(category: SheetCategory, unit: string): boolean {
  return category === "wireSize" && unit === "AWG";
}

interface ConversionResult {
  display: string;
  /** Value to carry over into the "from" field if the user swaps direction. */
  raw: string;
}

function computeConversion(
  category: SheetCategory,
  fromUnit: string,
  toUnit: string,
  fromValue: string,
): ConversionResult {
  if (category === "wireSize") {
    if (fromUnit === "AWG") {
      const mm2 = awgToMm2(fromValue);
      if (mm2 === undefined) return { display: "", raw: "" };
      const display = toUnit === "mm2" ? formatResult(mm2) : fromValue;
      return { display, raw: display };
    }
    if (fromValue === "") return { display: "", raw: "" };
    const num = Number(fromValue);
    if (Number.isNaN(num)) return { display: "", raw: "" };
    if (toUnit === "AWG") {
      const nearest = nearestAwgForMm2(num);
      return { display: nearest.awg, raw: nearest.awg };
    }
    return { display: fromValue, raw: fromValue };
  }

  if (fromValue === "") return { display: "", raw: "" };
  const num = Number(fromValue);
  if (Number.isNaN(num)) return { display: "", raw: "" };
  const display = formatResult(convert(category, num, fromUnit, toUnit));
  return { display, raw: display };
}

interface ConversionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ConversionSheet({ open, onClose }: ConversionSheetProps) {
  const [category, setCategory] = useState<SheetCategory>("length");
  const [fromUnit, setFromUnit] = useState(CATEGORY_DEFAULTS.length.fromUnit);
  const [toUnit, setToUnit] = useState(CATEGORY_DEFAULTS.length.toUnit);
  const [fromValue, setFromValue] = useState("");

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const unitOptions = unitOptionsFor(category);
  const result = computeConversion(category, fromUnit, toUnit, fromValue);

  function handleCategoryChange(next: SheetCategory) {
    setCategory(next);
    setFromUnit(CATEGORY_DEFAULTS[next].fromUnit);
    setToUnit(CATEGORY_DEFAULTS[next].toUnit);
    setFromValue(isAwgSelect(next, CATEGORY_DEFAULTS[next].fromUnit) ? WIRE_SIZE_TABLE[0].awg : "");
  }

  function handleFromUnitChange(nextUnit: string) {
    const wasSelect = isAwgSelect(category, fromUnit);
    const nowSelect = isAwgSelect(category, nextUnit);
    setFromUnit(nextUnit);
    if (wasSelect !== nowSelect) {
      setFromValue(nowSelect ? WIRE_SIZE_TABLE[0].awg : "");
    }
  }

  function handleSwap() {
    const nextFromUnit = toUnit;
    const nextToUnit = fromUnit;
    const nextFromIsSelect = isAwgSelect(category, nextFromUnit);
    setFromUnit(nextFromUnit);
    setToUnit(nextToUnit);
    setFromValue(result.raw || (nextFromIsSelect ? WIRE_SIZE_TABLE[0].awg : ""));
  }

  const fromValueOptions = isAwgSelect(category, fromUnit) ? WIRE_SIZE_VALUE_OPTIONS : undefined;
  const toValueOptions = isAwgSelect(category, toUnit) ? WIRE_SIZE_VALUE_OPTIONS : undefined;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close unit converter"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-96 sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Unit Converter
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              aria-pressed={category === tab.id}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                category === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <ConversionField
            label="From"
            value={fromValue}
            onValueChange={setFromValue}
            valueOptions={fromValueOptions}
            unit={fromUnit}
            onUnitChange={handleFromUnitChange}
            unitOptions={unitOptions}
          />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap conversion direction"
              className="rounded-full border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 4v10m0 0l-3-3m3 3l3-3M14 16V6m0 0l3 3m-3-3l-3 3"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <ConversionField
            label="To"
            value={result.display}
            readOnly
            valueOptions={toValueOptions}
            unit={toUnit}
            onUnitChange={setToUnit}
            unitOptions={unitOptions}
          />

          {category === "wireSize" && fromUnit === "mm2" && toUnit === "AWG" && result.display && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nearest standard AWG size shown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
