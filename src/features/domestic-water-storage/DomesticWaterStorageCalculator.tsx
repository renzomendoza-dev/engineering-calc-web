"use client";

import { useState } from "react";
import { OccupantLoadForm } from "./OccupantLoadForm";
import { FixtureUnitForm } from "./FixtureUnitForm";
import { DomesticWaterStorageResults } from "./DomesticWaterStorageResults";
import { DomesticWaterStorageFormula } from "./DomesticWaterStorageFormula";
import { DomesticWaterStorageReference } from "./DomesticWaterStorageReference";
import type { DemandBasis, DomesticWaterStorageResponse } from "./types";

const MODE_LABELS: Record<DemandBasis, string> = {
  OCCUPANT_LOAD: "By occupant count",
  FIXTURE_UNIT: "By fixture units",
};

const MODE_TABS: DemandBasis[] = ["OCCUPANT_LOAD", "FIXTURE_UNIT"];

/**
 * Owns the page-level state (mode, calculation result) so app/mechanical/storage/domestic/page.tsx
 * can stay a thin server component with no business logic — same tabs-swap-the-whole-form
 * pattern as PipeVelocityCalculator's two modes, since the backend request is likewise one
 * flat shape keyed by a mode discriminator (DemandBasisDto) with only the relevant fields
 * populated per mode, not two genuinely different response shapes needing separate results
 * displays.
 */
export function DomesticWaterStorageCalculator() {
  const [mode, setMode] = useState<DemandBasis>("OCCUPANT_LOAD");
  const [result, setResult] = useState<DomesticWaterStorageResponse | null>(null);

  function handleModeChange(next: DemandBasis) {
    setMode(next);
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2">
        {MODE_TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleModeChange(value)}
            aria-pressed={mode === value}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === value
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {MODE_LABELS[value]}
          </button>
        ))}
      </div>

      {mode === "OCCUPANT_LOAD" ? (
        <OccupantLoadForm onResult={setResult} />
      ) : (
        <FixtureUnitForm onResult={setResult} />
      )}

      {result && <DomesticWaterStorageResults result={result} />}
      <DomesticWaterStorageFormula />
      <DomesticWaterStorageReference />
    </div>
  );
}
