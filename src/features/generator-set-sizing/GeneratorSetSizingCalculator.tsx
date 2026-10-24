"use client";

import { useState } from "react";
import { GeneratorSetSizingForm } from "./GeneratorSetSizingForm";
import { GeneratorSetSizingResults } from "./GeneratorSetSizingResults";
import type { GeneratorSetSizingResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so
 * app/electrical/generator-set-sizing/page.tsx can stay a thin server component with no business
 * logic -- same pattern as PowerConsumptionCalculator.
 */
export function GeneratorSetSizingCalculator() {
  const [result, setResult] = useState<GeneratorSetSizingResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <GeneratorSetSizingForm onResult={setResult} />
      {result && <GeneratorSetSizingResults result={result} />}
    </div>
  );
}
