import { ResultCard } from "@/components/ui/ResultCard";
import type { WireSizingResponse } from "./types";

interface WireSizingResultsProps {
  result: WireSizingResponse;
}

export function WireSizingResults({ result }: WireSizingResultsProps) {
  const vdCheck = result.voltageDropCheckResult;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Recommended Conductor Size
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-900 dark:text-blue-100">
          {result.numberOfParallelSets > 1 && `${result.numberOfParallelSets} × `}
          {result.recommendedSizeLabel}
        </p>
        {result.numberOfParallelSets > 1 && (
          <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
            {result.numberOfParallelSets} identical conductors run in parallel, each carrying
            an equal share of the load — not {result.numberOfParallelSets} separate circuits.
          </p>
        )}
      </div>

      {!result.meetsTerminationRating && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-500 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
            {result.recommendedSizeLabel}&apos;s ampacity at the equipment&apos;s termination
            temperature rating does not cover the required load. Consider a larger conductor or
            a higher-rated termination.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard
          label="Derated Ampacity"
          value={result.deratedAmpacityAmps.toFixed(2)}
          unit="A"
          note={result.numberOfParallelSets > 1 ? "Per conductor." : undefined}
        />
        <ResultCard
          label="Required Ampacity"
          value={result.requiredAmpacityAmps.toFixed(2)}
          unit="A"
          note={result.numberOfParallelSets > 1 ? "Total across all parallel sets." : undefined}
        />
        {result.numberOfParallelSets > 1 && (
          <ResultCard
            label="Required Ampacity (per conductor)"
            value={result.requiredAmpacityPerSetAmps.toFixed(2)}
            unit="A"
            note={`Total ÷ ${result.numberOfParallelSets} sets — this is what the recommended size was actually sized against.`}
          />
        )}
        <ResultCard label="Base Ampacity" value={result.baseAmpacityAmps.toFixed(2)} unit="A" />
        <ResultCard
          label="Temp Correction Factor"
          value={result.tempCorrectionFactor.toFixed(3)}
        />
        <ResultCard label="Adjustment Factor" value={result.adjustmentFactor.toFixed(3)} />
      </div>

      {vdCheck && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Voltage Drop Check
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ResultCard
              label="Voltage Drop"
              value={vdCheck.voltageDropPercent.toFixed(2)}
              unit="%"
              tone={vdCheck.exceedsRecommendedLimit ? "warning" : "default"}
              note={
                vdCheck.exceedsRecommendedLimit
                  ? "Exceeds the PEC-recommended 3% maximum."
                  : undefined
              }
            />
            <ResultCard label="Size Checked" value={vdCheck.sizeLabelChecked} />
          </div>

          {vdCheck.upsizedRecommendation && (
            <div className="rounded-lg border border-violet-400 bg-violet-50 p-4 dark:border-violet-500 dark:bg-violet-950/40">
              <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
                Upsize for Voltage Drop
              </p>
              <p className="mt-1 text-sm text-violet-700 dark:text-violet-400">
                {result.recommendedSizeLabel} meets ampacity requirements but exceeds the
                voltage drop limit. Use <strong>{vdCheck.upsizedRecommendation}</strong> instead
                to satisfy both ampacity and voltage drop.
              </p>
            </div>
          )}

          {!vdCheck.upsizedRecommendation && vdCheck.exceedsRecommendedLimit && (
            <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-500 dark:bg-amber-950/40">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                No available size resolves the voltage drop within limits — consider a shorter
                run, higher voltage, or splitting the load.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
