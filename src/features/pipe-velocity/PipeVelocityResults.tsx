"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ui/ResultCard";
import { convert } from "@/lib/conversions";
import type { PipeVelocityResponse } from "./types";

const SPEED_DISPLAY_UNITS = ["ms", "fts"] as const;
const SPEED_UNIT_LABELS: Record<(typeof SPEED_DISPLAY_UNITS)[number], string> = {
  ms: "m/s",
  fts: "ft/s",
};

const LENGTH_DISPLAY_UNITS = ["mm", "in"] as const;

interface PipeVelocityResultsProps {
  result: PipeVelocityResponse;
}

/**
 * The backend always returns velocity in m/s and lengths in mm (fixed canonical output
 * units — see PipeVelocityResponse's Javadoc), so display-unit conversion happens entirely
 * client-side via the same conversions.ts table the unit converter FAB uses, rather than
 * re-requesting the calculation in a different unit.
 */
export function PipeVelocityResults({ result }: PipeVelocityResultsProps) {
  const [speedUnit, setSpeedUnit] = useState<(typeof SPEED_DISPLAY_UNITS)[number]>("fts");
  const [lengthUnit, setLengthUnit] = useState<(typeof LENGTH_DISPLAY_UNITS)[number]>("mm");

  function formatSpeed(valueMetresPerSecond: number): string {
    return convert("speed", valueMetresPerSecond, "ms", speedUnit).toFixed(3);
  }

  function formatLength(valueMm: number): string {
    return convert("length", valueMm, "mm", lengthUnit).toFixed(2);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            Velocity unit
            <select
              value={speedUnit}
              onChange={(event) => setSpeedUnit(event.target.value as (typeof SPEED_DISPLAY_UNITS)[number])}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {SPEED_DISPLAY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {SPEED_UNIT_LABELS[unit]}
                </option>
              ))}
            </select>
          </label>
          {result.mode === "DIAMETER_FROM_VELOCITY" && (
            <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              Length unit
              <select
                value={lengthUnit}
                onChange={(event) => setLengthUnit(event.target.value as (typeof LENGTH_DISPLAY_UNITS)[number])}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {LENGTH_DISPLAY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {result.mode === "VELOCITY_FROM_DIAMETER" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Non-null: backend populates velocityValue for this mode. */}
          <ResultCard label="Velocity" value={formatSpeed(result.velocityValue!)} unit={SPEED_UNIT_LABELS[speedUnit]} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Non-null: backend populates all four fields below for this mode. */}
          <ResultCard
            label="Calculated Minimum Diameter"
            value={formatLength(result.calculatedMinDiameterValue!)}
            unit={lengthUnit}
            note="Raw value before rounding up to a standard pipe size."
          />
          <ResultCard label="Resolved Nominal Pipe Size" value={result.nominalPipeSize!} />
          <ResultCard
            label="Actual Internal Diameter"
            value={formatLength(result.actualInternalDiameterValue!)}
            unit={lengthUnit}
          />
          <ResultCard
            label="Actual Velocity at Resolved Size"
            value={formatSpeed(result.actualVelocityValue!)}
            unit={SPEED_UNIT_LABELS[speedUnit]}
            note="Guaranteed at or below your target velocity — the resolved size is rounded up, never down."
          />
        </div>
      )}
    </div>
  );
}
