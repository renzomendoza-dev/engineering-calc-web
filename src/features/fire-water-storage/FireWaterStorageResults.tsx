import { ResultCard } from "@/components/ui/ResultCard";
import type { FireWaterStorageResponse } from "./types";

const LITRES_PER_US_GALLON = 3.78541;

interface FireWaterStorageResultsProps {
  result: FireWaterStorageResponse;
}

export function FireWaterStorageResults({ result }: FireWaterStorageResultsProps) {
  const volumeLitres = result.requiredStorageVolumeGallons * LITRES_PER_US_GALLON;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <ResultCard
        label="Resolved Duration Range"
        value={
          result.resolvedDurationMinutesMin === result.resolvedDurationMinutesMax
            ? result.resolvedDurationMinutesMin.toFixed(0)
            : `${result.resolvedDurationMinutesMin.toFixed(0)}-${result.resolvedDurationMinutesMax.toFixed(0)}`
        }
        unit="minutes"
      />

      {result.usedConservativeDefault && (
        <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          Using the conservative maximum of {result.durationMinutesUsed.toFixed(0)} minutes since
          no specific duration was selected.
        </div>
      )}

      <ResultCard
        label="Duration Used"
        value={result.durationMinutesUsed.toFixed(0)}
        unit="minutes"
      />

      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Required Storage Volume
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-900 dark:text-blue-100">
          {result.requiredStorageVolumeGallons.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="ml-1 text-lg font-normal text-blue-700 dark:text-blue-400">gallons</span>
        </p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          {volumeLitres.toLocaleString(undefined, { maximumFractionDigits: 0 })} liters
        </p>
      </div>
    </div>
  );
}
