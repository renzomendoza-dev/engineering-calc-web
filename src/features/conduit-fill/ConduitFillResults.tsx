import { AdvisoryNote } from "@/components/ui/AdvisoryNote";
import { ResultCard } from "@/components/ui/ResultCard";
import type { ConduitFillResponse } from "./types";

interface ConduitFillResultsProps {
  result: ConduitFillResponse;
}

const TIGHT_FIT_MARGIN_PERCENT = 5;
const DEFAULT_PULL_EASE_NOTE =
  "This combination may be difficult to pull through the conduit — consider a larger trade size or fewer conductors.";

export function ConduitFillResults({ result }: ConduitFillResultsProps) {
  // Null-safe by construction: `practicalFillAdvisory` is null whenever the backend has
  // nothing to flag (including, per the sanity check below, whenever requiresMultipleConduits
  // is true) — optional chaining means this never throws, it just evaluates to null and the
  // section below renders nothing.
  const advisory = result.practicalFillAdvisory?.mayBeDifficultToPull
    ? result.practicalFillAdvisory
    : null;

  if (result.requiresMultipleConduits) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-500 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
            No standard conduit size fits this conductor combination — consider splitting into
            multiple conduits.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ResultCard
            label="Total Conductor Area"
            value={result.totalConductorAreaMm2.toFixed(2)}
            unit="mm²"
          />
          <ResultCard label="Total Conductor Count" value={result.totalConductorCount} />
        </div>
        {advisory && (
          <AdvisoryNote label="Installation Tip">{advisory.note ?? DEFAULT_PULL_EASE_NOTE}</AdvisoryNote>
        )}
      </div>
    );
  }

  const isTightFit =
    result.actualFillPercentAtRecommendedSize !== null &&
    result.allowedFillPercent - result.actualFillPercentAtRecommendedSize <= TIGHT_FIT_MARGIN_PERCENT;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
      <div className="rounded-lg border border-blue-400 bg-blue-50 p-6 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Recommended Trade Size
        </p>
        <p className="mt-1 text-4xl font-bold text-blue-900 dark:text-blue-100">
          {result.recommendedTradeSizeMm} mm
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard
          label="Actual Fill"
          value={result.actualFillPercentAtRecommendedSize?.toFixed(2) ?? "—"}
          unit="%"
          tone={isTightFit ? "warning" : "default"}
          note={
            isTightFit
              ? "Close to the allowed fill limit — consider the next trade size up."
              : undefined
          }
        />
        <ResultCard label="Allowed Fill" value={result.allowedFillPercent.toFixed(2)} unit="%" />
        <ResultCard
          label="Total Conductor Area"
          value={result.totalConductorAreaMm2.toFixed(2)}
          unit="mm²"
        />
        <ResultCard label="Total Conductor Count" value={result.totalConductorCount} />
      </div>
      {advisory && (
        <AdvisoryNote label="Installation Tip">{advisory.note ?? DEFAULT_PULL_EASE_NOTE}</AdvisoryNote>
      )}
    </div>
  );
}
