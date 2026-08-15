"use client";

import { useState } from "react";
import { PowerForm } from "./PowerForm";
import { PowerResults } from "./PowerResults";
import { PowerFormula } from "./PowerFormula";
import type { PumpPowerResponse } from "./types";

interface PowerCalculatorProps {
  initialFlowRateValue?: string;
  initialFlowRateUnit?: string;
  initialTdh?: string;
}

export function PowerCalculator({
  initialFlowRateValue,
  initialFlowRateUnit,
  initialTdh,
}: PowerCalculatorProps) {
  const [result, setResult] = useState<PumpPowerResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PowerForm
        onResult={setResult}
        initialFlowRateValue={initialFlowRateValue}
        initialFlowRateUnit={initialFlowRateUnit}
        initialTdh={initialTdh}
      />
      {result && <PowerResults result={result} />}
      <PowerFormula />
    </div>
  );
}
