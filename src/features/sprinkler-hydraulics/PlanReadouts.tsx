"use client";

import type { ReactNode } from "react";
import { formatApiText } from "@/lib/apiText";
import { formatArea, formatFlow, formatLength, formatPressure } from "./format";
import { UNITS } from "./labels";
import type { RemoteAreaPlanState } from "./useRemoteAreaPlan";

function Stat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>}
    </div>
  );
}

/** What to say while there is nothing to show yet. */
function Waiting({ plan, children }: { plan: RemoteAreaPlanState; children: ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {plan.isCalculating ? "Working it out…" : children}
    </p>
  );
}

/**
 * The design basis, as the API worked it out: the area to protect (after any quick-response
 * reduction), what each sprinkler must flow, and the fewest sprinklers that cover the area.
 *
 * Shown in step 1 and updated as coverage, density, area or ceiling height change, so the effect of
 * each is visible where it is entered. Every figure is the API's -- nothing here multiplies or
 * divides -- and none of it needs the spacing or the pipe network.
 */
export function DesignBasisReadout({ plan }: { plan: RemoteAreaPlanState }) {
  const result = plan.result;
  if (!result) {
    return (
      <Waiting plan={plan}>
        Enter the design area, density and coverage per sprinkler and the design basis appears here.
      </Waiting>
    );
  }

  const stale = plan.isStale || plan.isCalculating;
  return (
    <div className="flex flex-col gap-3">
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 ${stale ? "opacity-60" : ""}`}>
        <Stat
          label="Area to protect"
          value={formatArea(result.adjustedDesignAreaSqFt)}
          unit={UNITS.area}
          note={
            result.reductionApplied
              ? `${formatArea(result.baseDesignAreaSqFt)} ${UNITS.area} less ${formatLength(result.reductionPercent)}% for quick-response sprinklers`
              : "The design area above, with no reduction"
          }
        />
        <Stat
          label="Flow per sprinkler"
          value={formatFlow(result.flowPerSprinklerGpm)}
          unit={UNITS.flow}
          note={`${formatArea(result.coveragePerSprinklerSqFt)} ${UNITS.area} at the design density`}
        />
        <Stat
          label="Sprinklers to cover the area"
          value={`at least ${result.sprinklersForArea}`}
          note="Rounded up; the layout in the pipe network step can only add to it"
        />
      </div>

      {result.warnings.filter((warning) => warning.includes("maximum")).map((warning) => (
        <p
          key={warning}
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
        >
          {formatApiText(warning)}
        </p>
      ))}

      {result.reductionApplied &&
        result.notes
          .filter((note) => note.startsWith("Reduction read from"))
          .map((note) => (
            <p key={note} className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatApiText(note)}
            </p>
          ))}
    </div>
  );
}

/**
 * The most remote sprinkler's starting pressure, shown as calculated rather than asked for: its
 * flow, the pressure that flow needs at its K factor, the minimum operating pressure, and which of
 * the two is used.
 *
 * It replaces an input. The pressure was always (flow / K)^2 floored at the minimum, so there was
 * nothing for the designer to decide; asking for it only let a figure below the minimum in.
 */
export function StartingPressureReadout({
  plan,
  kFactor,
}: {
  plan: RemoteAreaPlanState;
  kFactor: string;
}) {
  const result = plan.result;
  if (!result) {
    return (
      <Waiting plan={plan}>
        The starting pressure appears here once the design area, density and coverage in the first
        step are filled in.
      </Waiting>
    );
  }

  const stale = plan.isStale || plan.isCalculating;
  return (
    <div className={`flex flex-col gap-3 ${stale ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Flow per sprinkler"
          value={formatFlow(result.flowPerSprinklerGpm)}
          unit={UNITS.flow}
          note="Design density times coverage"
        />
        <Stat
          label={`Pressure that flow needs at K ${kFactor}`}
          value={formatPressure(result.pressureForFlowPsi)}
          unit={UNITS.pressure}
          note="(flow ÷ K) squared"
        />
        <Stat
          label="Minimum operating pressure"
          value={formatPressure(result.minimumOperatingPressurePsi)}
          unit={UNITS.pressure}
          note="No sprinkler is taken to operate below this"
        />
      </div>

      <div className="rounded-md border border-blue-300 bg-blue-50 p-3 dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Starting pressure at the most remote sprinkler:{" "}
          <strong className="font-semibold">
            {formatPressure(result.firstSprinklerPressurePsi)} {UNITS.pressure}
          </strong>
          , discharging {formatFlow(result.firstSprinklerFlowGpm)} {UNITS.flow}.
        </p>
        <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
          {result.floorGoverned
            ? "The flow needs less than the minimum operating pressure, so the minimum is used — and the sprinkler discharges more than the design flow."
            : "The pressure the flow needs is above the minimum operating pressure, so it is used as it stands."}
        </p>
      </div>
    </div>
  );
}
