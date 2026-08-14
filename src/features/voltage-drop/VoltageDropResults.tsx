import { ResultCard } from "@/components/ui/ResultCard";
import type { VoltageDropResponse } from "./types";

interface VoltageDropResultsProps {
  result: VoltageDropResponse;
}

export function VoltageDropResults({ result }: VoltageDropResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard
          label="Voltage Drop"
          value={result.voltageDropVolts.toFixed(2)}
          unit="V"
          tone={result.exceedsRecommendedLimit ? "warning" : "default"}
        />
        <ResultCard
          label="Voltage Drop"
          value={result.voltageDropPercent.toFixed(2)}
          unit="%"
          tone={result.exceedsRecommendedLimit ? "warning" : "default"}
          note={
            result.exceedsRecommendedLimit
              ? "Exceeds the PEC-recommended 3% maximum. Consider a larger conductor, a shorter run, or more parallel sets."
              : undefined
          }
        />
        <ResultCard
          label="Receiving-End Voltage"
          value={result.receivingEndVoltage.toFixed(2)}
          unit="V"
        />
      </div>
    </div>
  );
}
