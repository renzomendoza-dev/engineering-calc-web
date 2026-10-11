import { ResultCard } from "@/components/ui/ResultCard";
import { formatApiText } from "@/lib/apiText";
import type { FirePumpPowerResponse } from "./types";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

interface PowerResultsProps {
  result: FirePumpPowerResponse;
}

export function PowerResults({ result }: PowerResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      {/* rated-point-only's overload-not-evaluated caveat -- shown prominently, not buried,
          since skipping the 150% check is a real under-sizing risk. */}
      {result.driverSizingNote && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          {formatApiText(result.driverSizingNote)}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className={HEADER_CELL}>Flow (GPM)</th>
              <th className={HEADER_CELL}>Pressure (psi)</th>
              <th className={HEADER_CELL}>WHP</th>
              <th className={HEADER_CELL}>BHP</th>
            </tr>
          </thead>
          <tbody>
            {result.evaluatedPoints.map((point, index) => (
              <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <td className={DATA_CELL}>{point.flowGpm.toFixed(0)}</td>
                <td className={DATA_CELL}>{point.pressurePsi.toFixed(1)}</td>
                <td className={DATA_CELL}>{point.waterHorsepower.toFixed(2)}</td>
                <td className={DATA_CELL}>{point.brakeHorsepower.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Max Brake Horsepower" value={result.maxBrakeHorsepower.toFixed(2)} unit="BHP" />
        <ResultCard label="Recommended Motor Size" value={result.recommendedElectricMotorSize ?? "—"} />
      </div>
    </div>
  );
}
