"use client";

import { useState } from "react";
import { VoltageDropForm } from "./VoltageDropForm";
import { VoltageDropResults } from "./VoltageDropResults";
import { VoltageDropFormula } from "./VoltageDropFormula";
import type { VoltageDropResponse } from "./types";

/**
 * Owns the page-level state (the calculation result) so app/electrical/voltage-drop/page.tsx
 * can stay a thin server component with no business logic.
 */
export function VoltageDropCalculator() {
  const [result, setResult] = useState<VoltageDropResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <VoltageDropForm onResult={setResult} />
      {result && <VoltageDropResults result={result} />}
      <VoltageDropFormula />
    </div>
  );
}
