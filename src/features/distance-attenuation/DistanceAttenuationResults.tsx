import { ResultCard } from "@/components/ui/ResultCard";
import type { DistanceAttenuationRequest, DistanceAttenuationResponse } from "./types";

/** Explicit sign since direction (moving away vs. closer) is the point of this value. */
function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

interface DistanceAttenuationResultsProps {
  result: DistanceAttenuationResponse;
  request: DistanceAttenuationRequest;
}

export function DistanceAttenuationResults({ result, request }: DistanceAttenuationResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Target SPL" value={result.targetSplDb.toFixed(2)} unit="dB" />
        <ResultCard
          label="Attenuation"
          value={formatSigned(result.attenuationDb)}
          unit="dB"
          note={
            result.attenuationDb < 0
              ? "Level decreases moving from the reference to the target distance."
              : "Level increases moving from the reference to the target distance."
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Inputs</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResultCard label="Reference SPL" value={request.referenceSplDb.toFixed(1)} unit="dB" />
          <ResultCard label="Reference Distance" value={request.referenceDistance.toFixed(2)} unit="m" />
          <ResultCard label="Target Distance" value={request.targetDistance.toFixed(2)} unit="m" />
        </div>
      </div>
    </div>
  );
}
