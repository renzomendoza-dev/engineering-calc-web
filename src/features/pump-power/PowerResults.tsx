import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import type { PumpPowerResponse } from "./types";

interface PowerResultsProps {
  result: PumpPowerResponse;
}

export function PowerResults({ result }: PowerResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Hydraulic Power" value={result.hydraulicPowerKw.toFixed(2)} unit="kW" />
        <div className="flex flex-col justify-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Shaft Power</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {result.shaftPowerKw.toFixed(2)}
            <span className="ml-1 text-base font-normal text-zinc-500">kW</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">The real input power requirement.</p>
        </div>
      </div>

      {/* No unit prop: the API returns this pre-formatted with its unit, e.g. "5.5 kW". */}
      <HeadlineResult label="Recommended Motor Size" value={result.recommendedMotorSizeKw} />
    </div>
  );
}
