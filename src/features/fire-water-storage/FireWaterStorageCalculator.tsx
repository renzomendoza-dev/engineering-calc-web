"use client";

import { useState } from "react";
import { FireWaterStorageForm } from "./FireWaterStorageForm";
import { FireWaterStorageResults } from "./FireWaterStorageResults";
import { FireWaterStorageFormula } from "./FireWaterStorageFormula";
import { FireWaterStorageReference } from "./FireWaterStorageReference";
import type { FireWaterStorageResponse } from "./types";

interface FireWaterStorageCalculatorProps {
  initialRatedPumpFlow?: string;
}

export function FireWaterStorageCalculator({ initialRatedPumpFlow }: FireWaterStorageCalculatorProps) {
  const [result, setResult] = useState<FireWaterStorageResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <FireWaterStorageForm onResult={setResult} initialRatedPumpFlow={initialRatedPumpFlow} />
      {result && <FireWaterStorageResults result={result} />}
      <FireWaterStorageFormula />
      <FireWaterStorageReference />
    </div>
  );
}
