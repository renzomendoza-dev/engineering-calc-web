import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import type { PressureTankRequest, PressureTankResponse } from "./types";

interface PressureTankResultsProps {
  result: PressureTankResponse;
  request: PressureTankRequest;
}

export function PressureTankResults({ result, request }: PressureTankResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <HeadlineResult label="Required Tank Volume" value={result.requiredTankVolumeLiters.toFixed(1)} unit="L" />

      {request.controlType === "VFD" && (
        <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          VFD tanks are typically smaller than conventional pressure-switch tanks because they
          only need to cover brief sleep periods at low flow, not full-flow run cycles.
        </div>
      )}

      <ResultCard label="Drawdown Volume" value={result.drawdownVolumeLiters.toFixed(2)} unit="L" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Low Pressure (Absolute)" value={result.lowPressureAbsoluteKpa.toFixed(1)} unit="kPa" />
        <ResultCard label="High Pressure (Absolute)" value={result.highPressureAbsoluteKpa.toFixed(1)} unit="kPa" />
      </div>
    </div>
  );
}
