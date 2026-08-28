import { ResultCard } from "@/components/ui/ResultCard";
import type { PowerConsumptionResponse } from "./types";

interface PowerConsumptionResultsProps {
  result: PowerConsumptionResponse;
}

export function PowerConsumptionResults({ result }: PowerConsumptionResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="rounded-lg border border-blue-400 bg-blue-50 p-5 dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Energy Consumed</p>
        <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {result.energyConsumedKwh.toFixed(3)}
          <span className="ml-1 text-lg font-normal text-zinc-500">kWh</span>
        </p>
      </div>

      {result.estimatedCost !== null && (
        <div className="rounded-lg border border-emerald-400 bg-emerald-50 p-5 dark:border-emerald-500 dark:bg-emerald-950/40">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Estimated Cost</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {result.estimatedCost.toFixed(2)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Power" value={result.powerWatts.toFixed(1)} unit="W" />
        <ResultCard label="Power (kW)" value={result.powerKw.toFixed(3)} unit="kW" />
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
