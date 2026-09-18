import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import type { PowerConsumptionResponse } from "./types";

interface PowerConsumptionResultsProps {
  result: PowerConsumptionResponse;
}

export function PowerConsumptionResults({ result }: PowerConsumptionResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <HeadlineResult label="Energy Consumed" value={result.energyConsumedKwh.toFixed(3)} unit="kWh" />

      {result.estimatedCost !== null && (
        <HeadlineResult label="Estimated Cost" value={result.estimatedCost.toFixed(2)} tone="emerald" />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Power" value={result.powerWatts.toFixed(1)} unit="W" />
        <ResultCard label="Power" value={result.powerKw.toFixed(3)} unit="kW" />
      </div>

      {result.isEstimatedPower && (
        <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          This is an estimate based on horsepower and assumed motor efficiency, not a direct
          nameplate or measured value.
        </div>
      )}
    </div>
  );
}
