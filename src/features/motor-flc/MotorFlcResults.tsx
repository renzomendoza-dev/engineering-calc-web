import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { WireSizingResults } from "@/features/wire-sizing/WireSizingResults";
import type { MotorFlcFormResult, MotorFlcResponse } from "./types";

interface MotorFlcResultsProps {
  result: MotorFlcFormResult;
}

function MotorFlcSummary({ flc }: { flc: MotorFlcResponse }) {
  const wasAdjusted = flc.baseFlcAmps !== flc.flcAmps;

  return (
    <div className="flex flex-col gap-4">
      <HeadlineResult
        label="Full-Load Current"
        value={flc.flcAmps.toFixed(2)}
        unit="A"
        note={wasAdjusted ? `Adjusted from ${flc.baseFlcAmps.toFixed(2)} A at unity power factor.` : undefined}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Base FLC" value={flc.baseFlcAmps.toFixed(2)} unit="A" />
        <ResultCard
          label="Minimum Conductor Ampacity"
          value={flc.minimumConductorAmpacity.toFixed(2)}
          unit="A"
        />
      </div>
    </div>
  );
}

/**
 * Reuses wire-sizing's own WireSizingResults component directly for the pipeline case,
 * rather than reimplementing that display — it already renders its own "Results" heading
 * internally, so it appears just below this component's "Recommended Wire Size" heading.
 */
export function MotorFlcResults({ result }: MotorFlcResultsProps) {
  const flc = result.kind === "flc" ? result.data : result.data.motorFlcResult;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
        <MotorFlcSummary flc={flc} />
      </div>

      {result.kind === "pipeline" && (
        <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recommended Wire Size
          </h2>
          <WireSizingResults result={result.data.wireSizingResult} />
        </div>
      )}
    </div>
  );
}
