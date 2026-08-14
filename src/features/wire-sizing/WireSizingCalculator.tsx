"use client";

import { useState } from "react";
import { WireSizingForm } from "./WireSizingForm";
import { WireSizingResults } from "./WireSizingResults";
import type { WireSizingResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so app/electrical/wire-sizing/page.tsx
 * can stay a thin server component with no business logic — same pattern as
 * VoltageDropCalculator/ConduitFillCalculator.
 */
export function WireSizingCalculator() {
  const [result, setResult] = useState<WireSizingResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <WireSizingForm onResult={setResult} />
      {result && <WireSizingResults result={result} />}
    </div>
  );
}
