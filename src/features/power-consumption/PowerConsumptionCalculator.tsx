"use client";

import { useState } from "react";
import { PowerConsumptionForm } from "./PowerConsumptionForm";
import { PowerConsumptionResults } from "./PowerConsumptionResults";
import type { PowerConsumptionResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so
 * app/electrical/power-consumption/page.tsx can stay a thin server component with no business
 * logic -- same pattern as VoltageDropCalculator.
 */
export function PowerConsumptionCalculator() {
  const [result, setResult] = useState<PowerConsumptionResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PowerConsumptionForm onResult={setResult} />
      {result && <PowerConsumptionResults result={result} />}
    </div>
  );
}
