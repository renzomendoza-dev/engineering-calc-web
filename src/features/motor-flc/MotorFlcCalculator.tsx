"use client";

import { useState } from "react";
import { MotorFlcForm } from "./MotorFlcForm";
import { MotorFlcReference } from "./MotorFlcReference";
import { MotorFlcResults } from "./MotorFlcResults";
import type { MotorFlcFormResult } from "./types";

/**
 * Owns the page-level state (the calculation result) so app/electrical/motor-flc/page.tsx
 * can stay a thin server component with no business logic — same pattern as
 * VoltageDropCalculator/ConduitFillCalculator/WireSizingCalculator.
 */
export function MotorFlcCalculator() {
  const [result, setResult] = useState<MotorFlcFormResult | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <MotorFlcForm onResult={setResult} />
      {result && <MotorFlcResults result={result} />}
      <MotorFlcReference />
    </div>
  );
}
