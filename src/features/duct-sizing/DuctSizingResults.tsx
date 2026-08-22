import { ResultCard } from "@/components/ui/ResultCard";
import type { DuctSizingResponse } from "./types";

interface DuctSizingResultsProps {
  result: DuctSizingResponse;
}

/**
 * For Rectangular ducts, width x height is the actual answer (what you tell the sheet metal
 * shop) so it takes the prominent headline box, demoting equivalent diameter to a plain
 * supporting ResultCard alongside Reynolds Number / Friction Factor. For Round ducts, the
 * equivalent diameter IS the answer, so it takes the headline box directly. Reynolds Number
 * and Friction Factor get the same plain-ResultCard-in-a-grid treatment as pipe pressure loss's
 * secondary values (PressureLossResults) -- not collapsed.
 */
export function DuctSizingResults({ result }: DuctSizingResultsProps) {
  const isRectangular = result.ductWidthMm !== null && result.ductHeightMm !== null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Actual Velocity" value={result.actualVelocityMps.toFixed(2)} unit="m/s" />
        <ResultCard
          label="Actual Friction Rate"
          value={result.actualFrictionRatePaPerM.toFixed(3)}
          unit="Pa/m"
        />
        <div className="flex h-full flex-col justify-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {isRectangular ? (
            <>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Duct Size</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {result.ductWidthMm?.toFixed(1)} × {result.ductHeightMm?.toFixed(1)}
                <span className="ml-1 text-base font-normal text-zinc-500">mm</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Equivalent diameter {result.equivalentDiameterMm.toFixed(1)} mm
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Equivalent Diameter
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {result.equivalentDiameterMm.toFixed(1)}
                <span className="ml-1 text-base font-normal text-zinc-500">mm</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Reynolds Number" value={result.reynoldsNumber.toFixed(0)} />
        <ResultCard label="Friction Factor" value={result.frictionFactor.toFixed(4)} />
        {isRectangular && (
          <ResultCard
            label="Equivalent Diameter"
            value={result.equivalentDiameterMm.toFixed(1)}
            unit="mm"
          />
        )}
      </div>
    </div>
  );
}
