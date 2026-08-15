"use client";

import { useState } from "react";
import { TDHForm } from "./TDHForm";
import { TDHResults } from "./TDHResults";
import { TDHFormula } from "./TDHFormula";
import type { PumpTDHResponse } from "./types";

interface TdhResultState {
  response: PumpTDHResponse;
  flowRateValue: number;
  flowRateUnit: string;
}

export function TDHCalculator() {
  const [result, setResult] = useState<TdhResultState | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <TDHForm
        onResult={(response, flowRateValue, flowRateUnit) =>
          setResult({ response, flowRateValue, flowRateUnit })
        }
      />
      {result && (
        <TDHResults
          result={result.response}
          flowRateValue={result.flowRateValue}
          flowRateUnit={result.flowRateUnit}
        />
      )}
      <TDHFormula />
    </div>
  );
}
