"use client";

import { useState } from "react";
import { PowerForm } from "./PowerForm";
import { PowerResults } from "./PowerResults";
import { PowerFormula } from "./PowerFormula";
import type { FirePumpPowerResponse } from "./types";

export function PowerCalculator() {
  const [result, setResult] = useState<FirePumpPowerResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PowerForm onResult={setResult} />
      {result && <PowerResults result={result} />}
      <PowerFormula />
    </div>
  );
}
