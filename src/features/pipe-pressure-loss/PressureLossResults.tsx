import { ResultCard } from "@/components/ui/ResultCard";
import type { FlowRegime, PipePressureLossResponse } from "./types";

const REGIME_LABELS: Record<FlowRegime, string> = {
  LAMINAR: "Laminar",
  TRANSITIONAL: "Transitional",
  TURBULENT: "Turbulent",
};

const REGIME_BADGE_CLASSES: Record<FlowRegime, string> = {
  LAMINAR: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  TRANSITIONAL: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  TURBULENT: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

interface PressureLossResultsProps {
  result: PipePressureLossResponse;
}

export function PressureLossResults({ result }: PressureLossResultsProps) {
  const pressureLossKpa = result.pressureLossPascals / 1000;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Velocity" value={result.velocityMetersPerSecond.toFixed(3)} unit="m/s" />
        <ResultCard label="Reynolds Number" value={result.reynoldsNumber.toFixed(0)} />
        <div className="flex h-full flex-col justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Flow Regime</p>
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-sm font-semibold ${REGIME_BADGE_CLASSES[result.flowRegime]}`}
          >
            {REGIME_LABELS[result.flowRegime]}
          </span>
        </div>
      </div>

      {result.transitionalRegimeWarning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Flow is in the transitional zone — results use the turbulent correlation, but this
          range is inherently less predictable. Consider this when evaluating margin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Friction Factor" value={result.frictionFactor.toFixed(4)} />
        <ResultCard label="Head Loss" value={result.headLossMeters.toFixed(3)} unit="m" />
        <div className="flex flex-col justify-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pressure Loss</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {pressureLossKpa.toFixed(2)}
            <span className="ml-1 text-base font-normal text-zinc-500">kPa</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {result.pressureLossPascals.toFixed(0)} Pa
          </p>
        </div>
      </div>
    </div>
  );
}
