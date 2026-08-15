"use client";

import { useState } from "react";
import { DistanceAttenuationForm } from "./DistanceAttenuationForm";
import { DistanceAttenuationResults } from "./DistanceAttenuationResults";
import { DistanceAttenuationFormula } from "./DistanceAttenuationFormula";
import type { DistanceAttenuationRequest, DistanceAttenuationResponse } from "./types";

interface ResultState {
  response: DistanceAttenuationResponse;
  request: DistanceAttenuationRequest;
}

export function DistanceAttenuationCalculator() {
  const [result, setResult] = useState<ResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <DistanceAttenuationForm onResult={(response, request) => setResult({ response, request })} />
      {result && <DistanceAttenuationResults result={result.response} request={result.request} />}
      <DistanceAttenuationFormula />
    </div>
  );
}
