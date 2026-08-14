"use client";

import { useState } from "react";
import { DemandForm } from "./DemandForm";
import { DemandResults } from "./DemandResults";
import { DemandFormula } from "./DemandFormula";
import type { FirePumpDemandResponse } from "./types";

export function DemandCalculator() {
  const [result, setResult] = useState<FirePumpDemandResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <DemandForm onResult={setResult} />
      {result && <DemandResults result={result} />}
      <DemandFormula />
    </div>
  );
}
