"use client";

import { useState } from "react";
import { CurveValidationForm } from "./CurveValidationForm";
import { CurveValidationResults } from "./CurveValidationResults";
import { CurveValidationReference } from "./CurveValidationReference";
import type { FirePumpCurveValidationResponse } from "./types";

interface CurveValidationCalculatorProps {
  initialDemandFlow?: string;
  initialDemandPressure?: string;
}

export function CurveValidationCalculator({
  initialDemandFlow,
  initialDemandPressure,
}: CurveValidationCalculatorProps) {
  const [result, setResult] = useState<{
    response: FirePumpCurveValidationResponse;
    candidateRatedPressurePsi: number;
  } | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <CurveValidationReference />
      <CurveValidationForm
        onResult={(response, candidateRatedPressurePsi) => setResult({ response, candidateRatedPressurePsi })}
        initialDemandFlow={initialDemandFlow}
        initialDemandPressure={initialDemandPressure}
      />
      {result && (
        <CurveValidationResults
          result={result.response}
          candidateRatedPressurePsi={result.candidateRatedPressurePsi}
        />
      )}
    </div>
  );
}
