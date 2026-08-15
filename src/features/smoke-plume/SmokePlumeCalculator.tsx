"use client";

import { useState } from "react";
import { SmokePlumeForm } from "./SmokePlumeForm";
import { SmokePlumeResults } from "./SmokePlumeResults";
import type { SmokeProductionRequest, SmokeProductionResponse } from "./types";

interface ResultState {
  response: SmokeProductionResponse;
  request: SmokeProductionRequest;
}

export function SmokePlumeCalculator() {
  const [result, setResult] = useState<ResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <SmokePlumeForm onResult={(response, request) => setResult({ response, request })} />
      {result && <SmokePlumeResults result={result.response} request={result.request} />}
    </div>
  );
}
