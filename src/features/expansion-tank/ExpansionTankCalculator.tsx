"use client";

import { useState } from "react";
import { ExpansionTankForm } from "./ExpansionTankForm";
import { ExpansionTankResults } from "./ExpansionTankResults";
import { ExpansionTankFormula } from "./ExpansionTankFormula";
import type { ExpansionTankRequest, ExpansionTankResponse } from "./types";

interface ExpansionTankResultState {
  response: ExpansionTankResponse;
  request: ExpansionTankRequest;
}

export function ExpansionTankCalculator() {
  const [result, setResult] = useState<ExpansionTankResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <ExpansionTankForm onResult={(response, request) => setResult({ response, request })} />
      {result && <ExpansionTankResults result={result.response} request={result.request} />}
      <ExpansionTankFormula />
    </div>
  );
}
