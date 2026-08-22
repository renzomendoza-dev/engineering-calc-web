"use client";

import { useMemo, useState } from "react";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { useDuctVelocityLimits } from "@/hooks/useDuctVelocityLimits";
import type { DuctShape } from "./types";

interface DuctVelocitySuggestionHelperProps {
  shape: DuctShape;
  onSuggest: (maxVelocityMps: number) => void;
}

/**
 * ASHRAE Table 12-based "suggest a value" helper for the VELOCITY sizing method's max
 * velocity field. Deliberately a separate component from DuctSizingForm — this lookup logic
 * (location + NC/RC rating -> a suggested velocity, picking the round or rectangular column
 * based on the current shape toggle) is self-contained enough to not belong inlined into the
 * main form, matching this domain's convention of extracting a dedicated component when a
 * sub-feature has its own distinct fetch + selection state (e.g. PumpCurvePointsInput).
 *
 * Table 12 is an acoustic design target (NC/RC = Noise Criteria / Room Criteria), not a
 * code-mandated velocity limit — the note below is deliberately explicit about this
 * distinction so a suggested value isn't mistaken for a compliance requirement.
 */
export function DuctVelocitySuggestionHelper({ shape, onSuggest }: DuctVelocitySuggestionHelperProps) {
  const { rows, isLoading, error } = useDuctVelocityLimits();
  const [ductLocation, setDuctLocation] = useState("");
  const [ncRcRating, setNcRcRating] = useState("");

  const locationOptions: SelectOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (!seen.has(row.ductLocation)) {
        seen.set(row.ductLocation, row.label);
      }
    }
    return [
      { value: "", label: isLoading ? "Loading…" : "Select a duct location" },
      ...Array.from(seen, ([value, label]) => ({ value, label })),
    ];
  }, [rows, isLoading]);

  const ratingOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<number>();
    for (const row of rows) {
      seen.add(row.ncRcRating);
    }
    return [
      { value: "", label: "Select an NC/RC rating" },
      ...Array.from(seen)
        .sort((a, b) => b - a)
        .map((rating) => ({ value: String(rating), label: `NC/RC ${rating}` })),
    ];
  }, [rows]);

  const matchingRow = rows.find(
    (row) => row.ductLocation === ductLocation && String(row.ncRcRating) === ncRcRating,
  );
  const suggestedValue = matchingRow
    ? (shape === "ROUND" ? matchingRow.maxVelocityRoundMps : matchingRow.maxVelocityRectangularMps)
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Suggest a value (ASHRAE Table 12)
      </p>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load velocity limit data ({error}).
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Duct Location"
          options={locationOptions}
          disabled={isLoading || !!error}
          value={ductLocation}
          onChange={(e) => setDuctLocation(e.target.value)}
        />
        <SelectField
          label="Acoustic Rating"
          options={ratingOptions}
          disabled={isLoading || !!error}
          value={ncRcRating}
          onChange={(e) => setNcRcRating(e.target.value)}
        />
      </div>

      <button
        type="button"
        disabled={suggestedValue === null}
        onClick={() => suggestedValue !== null && onSuggest(suggestedValue)}
        className="self-start rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
      >
        {suggestedValue !== null
          ? `Use ${suggestedValue} m/s`
          : "Use this value"}
      </button>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        This suggests a value to avoid objectionable duct noise (NC/RC = Noise Criteria / Room
        Criteria acoustic design target) — it is not a code-mandated limit. A design exceeding
        it is not necessarily non-compliant with any code.
      </p>
    </div>
  );
}
