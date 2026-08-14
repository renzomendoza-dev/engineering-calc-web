"use client";

import { useState } from "react";
import { CapacityForm } from "./CapacityForm";
import { CapacityResults } from "./CapacityResults";
import type { FirePumpCapacityResponse } from "./types";

interface CapacityCalculatorProps {
  initialRatedFlow?: string;
}

export function CapacityCalculator({ initialRatedFlow }: CapacityCalculatorProps) {
  const [result, setResult] = useState<FirePumpCapacityResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <CapacityForm onResult={setResult} initialRatedFlow={initialRatedFlow} />
      {result && <CapacityResults result={result} />}
    </div>
  );
}
