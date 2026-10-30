"use client";

import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { CheckTable } from "../CheckTable";
import {
  STATUS_LABELS,
  formatArea,
  formatFactor,
  formatFlow,
  formatKw,
  formatLength,
  formatTemperature,
} from "../format";
import type { NaturalVentingCalculationState } from "../useNaturalVentingCalculation";
import {
  CHECK_STATUSES,
  type CheckStatus,
  type FireCaseResult,
  type NaturalVentingResponse,
  type VentingCheck,
} from "../types";

interface ResultsStepProps {
  state: NaturalVentingCalculationState;
}

/**
 * Step 4: what the API returned, per curtained area. Nothing is calculated here; the page lays
 * out the response, counts the compliance lines by status, and marks the fire case that asks for
 * the most vent area in each area.
 */
export function ResultsStep({ state }: ResultsStepProps) {
  const { result, isCalculating, isStale, isComplete } = state;

  if (!result) {
    return (
      <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        {isComplete && isCalculating
          ? "Calculating…"
          : "Complete the earlier steps and the results appear here."}
      </p>
    );
  }

  const dimmed = isStale || isCalculating;
  const counts = countByStatus(result);

  return (
    <div className={`flex flex-col gap-8 transition-opacity ${dimmed ? "opacity-60" : ""}`}>
      <StatusSummary counts={counts} updating={dimmed} />

      {result.zones.map((zone) => {
        const fires = result.fireCases.filter((fire) => fire.zoneName === zone.name);
        const controlling = controllingFire(fires);
        return (
          <section key={zone.name} className="flex flex-col gap-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{zone.name}</h3>
            <div>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Dimensions and spacing
              </h4>
              <CheckTable checks={zone.checks} />
            </div>
            {fires.map((fire) => (
              <FireCasePanel key={fire.name} fire={fire} controlling={fire === controlling && fires.length > 1} />
            ))}
          </section>
        );
      })}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        NFPA 204 (2021), hand calculations of Section 9.2. Lines marked &ldquo;Not NFPA 204&rdquo;
        come from the informative annexes and are not requirements of the standard. A line marked
        Open could not be checked because an input was left blank.
      </p>
    </div>
  );
}

function countByStatus(result: NaturalVentingResponse): Record<CheckStatus, number> {
  const counts = Object.fromEntries(CHECK_STATUSES.map((status) => [status, 0])) as Record<
    CheckStatus,
    number
  >;
  const all: VentingCheck[] = [
    ...result.zones.flatMap((zone) => zone.checks),
    ...result.fireCases.flatMap((fire) => fire.checks),
  ];
  for (const check of all) counts[check.status] += 1;
  return counts;
}

/** The fire case needing the largest vent area; cases with no area (inlet too small) are skipped. */
function controllingFire(fires: FireCaseResult[]): FireCaseResult | null {
  let best: FireCaseResult | null = null;
  for (const fire of fires) {
    if (fire.requiredVentArea === null) continue;
    if (best === null || fire.requiredVentArea > (best.requiredVentArea ?? 0)) best = fire;
  }
  return best;
}

function StatusSummary({
  counts,
  updating,
}: {
  counts: Record<CheckStatus, number>;
  updating: boolean;
}) {
  const hasFail = counts.FAIL > 0;
  return (
    <div
      role="status"
      className={`rounded-lg border p-4 ${
        hasFail
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {hasFail
          ? `${counts.FAIL} ${counts.FAIL === 1 ? "check fails" : "checks fail"}`
          : "No check fails"}
        {updating && <span className="ml-2 font-normal text-zinc-500">updating…</span>}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        {CHECK_STATUSES.map((status) => (
          <li key={status}>
            {STATUS_LABELS[status]}: <span className="font-semibold tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FireCasePanel({ fire, controlling }: { fire: FireCaseResult; controlling: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {fire.name}
        {controlling && (
          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Largest vent area in this area
          </span>
        )}
      </h4>

      {fire.requiredVentArea !== null ? (
        <HeadlineResult
          label="Required total geometric vent area"
          value={formatArea(fire.requiredVentArea)}
          unit="m²"
          note={
            fire.inletCorrection !== null
              ? `Includes the inlet term, M = ${formatFactor(fire.inletCorrection)}.`
              : "The inlet is not defined, so this leaves the inlet term out and is a lower bound."
          }
        />
      ) : (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          The inlet area given cannot pass the plume flow at this layer temperature, so no vent area
          is large enough. Enlarge the inlets.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          label="Design fire Q"
          value={formatKw(fire.designHeatReleaseRate)}
          unit="kW"
          note={fire.heatReleaseRateCapped ? "Limited to the fuel-limited maximum." : undefined}
        />
        <ResultCard label="Fire diameter D" value={formatLength(fire.fireDiameter)} unit="m" />
        <ResultCard
          label="Mean flame height L"
          value={formatLength(fire.meanFlameHeight)}
          unit="m"
          note={
            fire.regime === "REACHES_LAYER"
              ? "The flames reach the smoke layer (Eq. 9.2.3.7)."
              : "The flames stay below the smoke layer (Eq. 9.2.3.6)."
          }
        />
        <ResultCard label="Plume mass flow" value={formatFlow(fire.plumeMassFlow)} unit="kg/s" />
        <ResultCard
          label="Layer temperature rise"
          value={formatTemperature(fire.layerTemperatureRise)}
          unit="K"
          note={`Layer at ${formatTemperature(fire.layerTemperature)} K.`}
        />
        <ResultCard
          label="Aerodynamic vent area"
          value={formatArea(fire.aerodynamicVentArea)}
          unit="m²"
          note="Cd,v × Av with no inlet restriction."
        />
        {fire.requiredInletArea !== null && (
          <ResultCard label="Inlet area for the chosen ratio" value={formatArea(fire.requiredInletArea)} unit="m²" />
        )}
        <ResultCard
          label="Inlet area for 1 m/s"
          value={formatArea(fire.inletAreaForVelocityLimit)}
          unit="m²"
          note="Net free area at the plume mass flow (6.6.3)."
        />
      </div>

      <CheckTable checks={fire.checks} />
    </div>
  );
}
