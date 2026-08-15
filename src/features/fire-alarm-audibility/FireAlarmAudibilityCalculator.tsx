"use client";

import { useState } from "react";
import { FireAlarmAudibilityForm } from "./FireAlarmAudibilityForm";
import { FireAlarmAudibilityResults } from "./FireAlarmAudibilityResults";
import { FireAlarmAudibilityFormula } from "./FireAlarmAudibilityFormula";
import type {
  FireAlarmAudibilityRequest,
  FireAlarmAudibilityResponse,
  FireAlarmNotificationMode,
} from "./types";

interface ResultState {
  response: FireAlarmAudibilityResponse;
  request: FireAlarmAudibilityRequest;
}

export function FireAlarmAudibilityCalculator() {
  const [result, setResult] = useState<ResultState | null>(null);
  const [mode, setMode] = useState<FireAlarmNotificationMode>("PUBLIC");

  return (
    <div className="flex flex-col gap-8">
      <FireAlarmAudibilityForm
        onResult={(response, request) => setResult({ response, request })}
        onModeChange={setMode}
      />
      {result && <FireAlarmAudibilityResults result={result.response} request={result.request} />}
      <FireAlarmAudibilityFormula mode={mode} />
    </div>
  );
}
