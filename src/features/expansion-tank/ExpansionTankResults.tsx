import { ResultCard } from "@/components/ui/ResultCard";
import type { ExpansionTankRequest, ExpansionTankResponse } from "./types";

interface ExpansionTankResultsProps {
  result: ExpansionTankResponse;
  request: ExpansionTankRequest;
}

/**
 * The piping-vs-vessel split isn't returned by the API (ExpansionTankResponse only reports the
 * combined derivedSystemVolumeLiters) -- it's re-derived here from the same request fields the
 * user already submitted, using calc-core's own documented piping-volume formula
 * ((pi/4)*d^2*L), so the two contributions sum exactly to derivedSystemVolumeLiters including
 * the additionalVolumeFactor scaling.
 */
function pipingContributionLiters(request: ExpansionTankRequest): number {
  const diameterM = request.averagePipeDiameterMm / 1000;
  const pipingVolumeM3 = (Math.PI / 4) * diameterM * diameterM * request.estimatedPipingLengthMeters;
  return pipingVolumeM3 * 1000;
}

export function ExpansionTankResults({ result, request }: ExpansionTankResultsProps) {
  const additionalVolumeFactor = request.additionalVolumeFactor ?? 1.0;
  const vesselContributionLiters = request.primaryVesselVolumeLiters * additionalVolumeFactor;
  const pipingContribution = pipingContributionLiters(request) * additionalVolumeFactor;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="rounded-lg border border-blue-400 bg-blue-50 p-5 dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Required Tank Volume</p>
        <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {result.requiredTankVolumeLiters.toFixed(1)}
          <span className="ml-1 text-lg font-normal text-zinc-500">L</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Expansion Volume" value={result.expansionVolumeLiters.toFixed(2)} unit="L" />
        <ResultCard
          label="Derived System Volume"
          value={result.derivedSystemVolumeLiters.toFixed(1)}
          unit="L"
        />
      </div>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          System volume breakdown
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ResultCard label="Primary Vessel Contribution" value={vesselContributionLiters.toFixed(1)} unit="L" />
          <ResultCard label="Piping Contribution (estimated)" value={pipingContribution.toFixed(2)} unit="L" />
        </div>
      </details>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Cold Water Density" value={result.coldWaterDensityKgM3.toFixed(1)} unit="kg/m³" />
        <ResultCard label="Hot Water Density" value={result.hotWaterDensityKgM3.toFixed(1)} unit="kg/m³" />
        <ResultCard
          label="Fill Pressure (Absolute)"
          value={result.fillPressureAbsoluteKpa.toFixed(1)}
          unit="kPa"
        />
        <ResultCard
          label="Max Operating Pressure (Absolute)"
          value={result.maxOperatingPressureAbsoluteKpa.toFixed(1)}
          unit="kPa"
        />
      </div>
    </div>
  );
}
