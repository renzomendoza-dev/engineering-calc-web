"use client";

import { useState } from "react";
import { TSquaredSmokePlumeForm } from "./TSquaredSmokePlumeForm";
import { TSquaredSmokePlumeResults } from "./TSquaredSmokePlumeResults";
import type { TSquaredSmokeProductionRequest, TSquaredSmokeProductionResponse } from "./types";

interface ResultState {
  response: TSquaredSmokeProductionResponse;
  request: TSquaredSmokeProductionRequest;
}

export function TSquaredSmokePlumeCalculator() {
  const [result, setResult] = useState<ResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <TSquaredSmokePlumeForm onResult={(response, request) => setResult({ response, request })} />
      {result && <TSquaredSmokePlumeResults result={result.response} request={result.request} />}
    </div>
  );
}
