"use client";

import { useState } from "react";
import { PressureLossForm } from "./PressureLossForm";
import { PressureLossResults } from "./PressureLossResults";
import { PressureLossFormula } from "./PressureLossFormula";
import type { PipePressureLossResponse } from "./types";

export function PressureLossCalculator() {
  const [result, setResult] = useState<PipePressureLossResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PressureLossForm onResult={setResult} />
      {result && <PressureLossResults result={result} />}
      <PressureLossFormula />
    </div>
  );
}
