"use client";

import { useState } from "react";
import { CheckVelocityForm } from "./CheckVelocityForm";
import { SizePipeForm } from "./SizePipeForm";
import { PipeVelocityResults } from "./PipeVelocityResults";
import { PipeVelocityFormula } from "./PipeVelocityFormula";
import type { PipeSizingMode, PipeVelocityResponse } from "./types";

const MODE_LABELS: Record<PipeSizingMode, string> = {
  VELOCITY_FROM_DIAMETER: "Check velocity",
  DIAMETER_FROM_VELOCITY: "Size a pipe",
};

const MODE_TABS: PipeSizingMode[] = ["VELOCITY_FROM_DIAMETER", "DIAMETER_FROM_VELOCITY"];

/**
 * Owns the page-level state (mode, calculation result) so app/mechanical/pipe-velocity/page.tsx
 * can stay a thin server component with no business logic. Switching modes shows a genuinely
 * different form (CheckVelocityForm vs SizePipeForm) rather than one form with conditional
 * fields, and clears any prior result since the two modes' result shapes don't overlap.
 */
export function PipeVelocityCalculator() {
  const [mode, setMode] = useState<PipeSizingMode>("VELOCITY_FROM_DIAMETER");
  const [result, setResult] = useState<PipeVelocityResponse | null>(null);

  function handleModeChange(next: PipeSizingMode) {
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

      {mode === "VELOCITY_FROM_DIAMETER" ? (
        <CheckVelocityForm onResult={setResult} />
      ) : (
        <SizePipeForm onResult={setResult} />
      )}

      {result && <PipeVelocityResults result={result} />}
      <PipeVelocityFormula mode={mode} />
    </div>
  );
}
