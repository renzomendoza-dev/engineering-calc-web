import { HeadlineResult } from "@/components/ui/HeadlineResult";
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

      <HeadlineResult
        label="Required Storage Volume"
        value={result.requiredStorageVolumeM3.toFixed(2)}
        unit="m³"
        secondaryValue={`${volumeLitres.toLocaleString(undefined, { maximumFractionDigits: 0 })} liters`}
      />

      <ResultCard
        label="Resolved Demand Flow Rate"
        value={result.resolvedDemandFlowRateLps.toFixed(3)}
        unit="L/s"
      />
    </div>
  );
}
