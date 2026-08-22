"use client";

import { useState } from "react";
import { PressureTankForm } from "./PressureTankForm";
import { PressureTankResults } from "./PressureTankResults";
import { PressureTankFormula } from "./PressureTankFormula";
import type { PressureTankRequest, PressureTankResponse } from "./types";

interface PressureTankResultState {
  response: PressureTankResponse;
  request: PressureTankRequest;
}

export function PressureTankCalculator() {
  const [result, setResult] = useState<PressureTankResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PressureTankForm onResult={(response, request) => setResult({ response, request })} />
      {result && <PressureTankResults result={result.response} request={result.request} />}
      <PressureTankFormula />
    </div>
  );
}
