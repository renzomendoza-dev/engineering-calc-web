"use client";

import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { formatFlow, formatPercent, formatPressure } from "../format";
import { IdenticalBranchTable } from "../IdenticalBranchTable";
import { SprinklerFlowTable } from "../SprinklerFlowTable";
import { UNITS } from "../labels";
import { SegmentWorksheetTable } from "../SegmentWorksheetTable";
import { SprinklerFormulas } from "../SprinklerFormulas";
import { SupplyCurveChart } from "../SupplyCurveChart";
import { PumpAndStorageSection } from "../PumpAndStorageSection";
import type { SprinklerForm } from "../stepProps";
import type { SprinklerCalculationState } from "../useSprinklerCalculation";

interface ResultsStepProps {
  state: SprinklerCalculationState;
  form: SprinklerForm;
}

/**
 * Step 5. The same figures as the summary panel, in full. Every value is read straight from the
 * response — the margin, the percentage and the verdict are the API's, not recomputed here.
 */
export function ResultsStep({ state, form }: ResultsStepProps) {
  const { result, isStale, isComplete } = state;
  const identicalBranches = result?.identicalBranches ?? [];
  const sprinklers = result?.sprinklers ?? [];

  if (!result) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No result yet. Go back through the steps and fill in the design figures, the water supply
        flow test and the pipe network; the calculation runs as soon as the input is complete.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {(isStale || !isComplete) && (
        <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {isComplete
            ? "The input has changed since this result — it is being recalculated."
            : "The input is no longer complete, so this result is from the last complete version."}
        </p>
      )}

      {/* With no supply there is no margin to headline, so the figure a pump or supply has to
          meet takes its place -- rather than a blank card or a verdict nobody asked for. */}
      {result.passes == null ? (
        <HeadlineResult
          label="Required pressure at the supply"
          value={formatPressure(result.requiredPressureAtSupplyPsi)}
          unit={UNITS.pressure}
          secondaryValue={`at ${formatFlow(result.totalDemandFlowGpm)} ${UNITS.flow}`}
          note="No water supply was given, so there is no margin or verdict. This is what the supply or pump has to deliver."
        />
      ) : (
        <HeadlineResult
          label="Safety margin"
          value={formatPressure(result.safetyMarginPsi!)}
          unit={UNITS.pressure}
          secondaryValue={`${formatPercent(result.safetyMarginPercent!)}% of the available pressure`}
          note={
            result.passes
              ? "The water supply meets the system demand."
              : "The water supply does not meet the system demand."
          }
          tone={result.passes ? "emerald" : "blue"}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard
          label="Total demand flow"
          value={formatFlow(result.totalDemandFlowGpm)}
          unit={UNITS.flow}
        />
        <ResultCard
          label="Required pressure at the supply"
          value={formatPressure(result.requiredPressureAtSupplyPsi)}
          unit={UNITS.pressure}
        />
        <ResultCard
          label="Available pressure at that flow"
          value={
            result.availablePressureAtDemandPsi == null
              ? "—"
              : formatPressure(result.availablePressureAtDemandPsi)
          }
          unit={result.availablePressureAtDemandPsi == null ? undefined : UNITS.pressure}
          tone={result.passes === false ? "warning" : "default"}
          note={
            result.passes === false
              ? "Below the required pressure — the supply cannot deliver this demand."
              : undefined
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Friction loss worksheet
        </h3>
        <SegmentWorksheetTable segments={result.segments} />
      </section>

      {/* What each listed sprinkler discharges: the worksheet above carries flow that accumulates
          along a branch, which is not the same thing. */}
      {sprinklers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sprinklers</h3>
          <SprinklerFlowTable rows={sprinklers} />
        </section>
      )}

      {/* Only present when a branch was declared identical to another instead of listed. */}
      {identicalBranches.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Identical branches
          </h3>
          <IdenticalBranchTable rows={identicalBranches} />
        </section>
      )}

      {/* Nothing to plot a demand against when no supply was given. */}
      {result.supplyCurve.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Supply curve and demand
          </h3>
          <SupplyCurveChart result={result} />
        </section>
      )}

      {/* Sized from the demand above, by the fire pump and fire water storage calculators. */}
      <PumpAndStorageSection form={form} result={result} />

      <SprinklerFormulas />

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          disabled
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generate report
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Coming soon — a printable calculation sheet isn&apos;t built yet.
        </p>
      </div>
    </div>
  );
}
