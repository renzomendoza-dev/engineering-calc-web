import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import type { WireSizingResponse } from "./types";

interface WireSizingResultsProps {
  result: WireSizingResponse;
  /**
   * The 2.40.1.4 overcurrent limits. Off where the conductor's protection follows its own article
   * (motor circuits, Article 4.30, through Table 2.40.1.4(G)).
   */
  showProtectionLimits?: boolean;
}

/** Why the given device may not protect the size that carries the load, for the banner. */
function limitReason(result: WireSizingResponse): string {
  switch (result.overcurrentLimitClause) {
    case "2.40.1.4(B)":
      return result.multipleReceptacleBranchCircuit
        ? "is above its ampacity, and PEC 2.40.1.4(B)(1) allows no rating above it on a branch circuit with more than one receptacle for portable loads"
        : "is above its ampacity by more than the next standard rating PEC 2.40.1.4(B) allows";
    case "2.40.1.4(C)":
      return "is over 800 A, and PEC 2.40.1.4(C) then wants the ampacity to reach it";
    case "2.40.1.4(D)":
      return "is above what PEC 2.40.1.4(D) lets protect a conductor that small";
    default:
      return "is more than PEC 2.40.1.4 lets protect it";
  }
}

export function WireSizingResults({ result, showProtectionLimits = true }: WireSizingResultsProps) {
  const vdCheck = result.voltageDropCheckResult;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <HeadlineResult
        label="Recommended Conductor Size"
        value={
          result.numberOfParallelSets > 1
            ? `${result.numberOfParallelSets} × ${result.recommendedSizeLabel}`
            : result.recommendedSizeLabel
        }
        note={
          result.numberOfParallelSets > 1
            ? `${result.numberOfParallelSets} identical conductors run in parallel, each carrying an equal share of the load — not ${result.numberOfParallelSets} separate circuits.`
            : undefined
        }
      />

      {showProtectionLimits && result.sizeRaisedForOvercurrentLimit && result.overcurrentDeviceAmps !== null && (
        <div className="rounded-lg border border-violet-400 bg-violet-50 p-4 dark:border-violet-500 dark:bg-violet-950/40">
          <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
            Raised for the overcurrent device
          </p>
          <p className="mt-1 text-sm text-violet-700 dark:text-violet-400">
            {result.ampacitySizeLabel} carries the load, but a {result.overcurrentDeviceAmps} A device{" "}
            {limitReason(result)}. Use{" "}
            <strong>{result.recommendedSizeLabel}</strong> with that device.
          </p>
        </div>
      )}

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
        {showProtectionLimits && result.standardRatingLimitAmps !== null && (
          <ResultCard
            label="Largest Standard Device"
            value={String(result.standardRatingLimitAmps)}
            unit="A"
            note={
              result.multipleReceptacleBranchCircuit
                ? `PEC 2.40.1.4(B)(1): a branch circuit with more than one receptacle for portable loads takes no rating above the ${result.protectedAmpacityAmps.toFixed(2)} A ampacity (Table 2.40.1.6(A)).`
                : `PEC 2.40.1.4(B) and (C): the ${result.protectedAmpacityAmps.toFixed(2)} A ampacity, or the next standard rating above it up to 800 A (Table 2.40.1.6(A)).`
            }
          />
        )}
        {showProtectionLimits && result.maximumOvercurrentDeviceAmps !== null && (
          <ResultCard
            label="Largest Overcurrent Device"
            value={String(result.maximumOvercurrentDeviceAmps)}
            unit="A"
            tone={
              result.overcurrentDeviceAmps !== null &&
              result.overcurrentDeviceAmps > result.maximumOvercurrentDeviceAmps
                ? "warning"
                : "default"
            }
            note="PEC 2.40.1.4(D) Small Conductors: the most that may protect this size, whatever its ampacity. Does not apply to taps (2.40.1.4(E)) or the cases of 2.40.1.4(G)."
          />
        )}
        <ResultCard label="Base Ampacity" value={result.baseAmpacityAmps.toFixed(2)} unit="A" />
        <ResultCard
          label="Temp Correction Factor"
          value={result.tempCorrectionFactor.toFixed(3)}
        />
        <ResultCard
          label="Adjustment Factor"
          value={result.adjustmentFactor.toFixed(3)}
          note={
            result.nipple
              ? "Nipple of not more than 600 mm: the 3.10.2.6(B)(3)(a) factor for the number of conductors need not apply (PEC Chapter 10, note 4)."
              : undefined
          }
        />
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
