import { ResultCard } from "@/components/ui/ResultCard";
import type { FirePumpCapacityResponse } from "./types";

interface CapacityResultsProps {
  result: FirePumpCapacityResponse;
}

export function CapacityResults({ result }: CapacityResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <ResultCard label="Recommended Standard Pump Capacity" value={result.standardFlowGpm.toFixed(0)} unit="GPM" />
    </div>
  );
}
