"use client";

import { useState } from "react";
import { VentAreaForm } from "./VentAreaForm";
import { VentAreaResults } from "./VentAreaResults";
import type { VentAreaRequest, VentAreaResponse } from "./types";

interface ResultState {
  response: VentAreaResponse;
  request: VentAreaRequest;
}

interface VentAreaCalculatorProps {
  initialVolumetricFlowRate?: string;
  initialSmokeTemperature?: string;
  initialAmbientTemperature?: string;
}

export function VentAreaCalculator({
  initialVolumetricFlowRate,
  initialSmokeTemperature,
  initialAmbientTemperature,
}: VentAreaCalculatorProps) {
  const [result, setResult] = useState<ResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <VentAreaForm
        onResult={(response, request) => setResult({ response, request })}
        initialVolumetricFlowRate={initialVolumetricFlowRate}
        initialSmokeTemperature={initialSmokeTemperature}
        initialAmbientTemperature={initialAmbientTemperature}
      />
      {result && <VentAreaResults result={result.response} request={result.request} />}
    </div>
  );
}
