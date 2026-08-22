import { ResultCard } from "@/components/ui/ResultCard";
import type { DomesticWaterStorageResponse } from "./types";

const LITRES_PER_M3 = 1000;

interface DomesticWaterStorageResultsProps {
  result: DomesticWaterStorageResponse;
}

export function DomesticWaterStorageResults({ result }: DomesticWaterStorageResultsProps) {
  const volumeLitres = result.requiredStorageVolumeM3 * LITRES_PER_M3;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Required Storage Volume
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-900 dark:text-blue-100">
          {result.requiredStorageVolumeM3.toFixed(2)}
          <span className="ml-1 text-lg font-normal text-blue-700 dark:text-blue-400">m³</span>
        </p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          {volumeLitres.toLocaleString(undefined, { maximumFractionDigits: 0 })} liters
        </p>
      </div>

      <ResultCard
        label="Resolved Demand Flow Rate"
        value={result.resolvedDemandFlowRateLps.toFixed(3)}
        unit="L/s"
      />
    </div>
  );
}
