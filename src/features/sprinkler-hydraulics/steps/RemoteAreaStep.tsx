"use client";

import { NumberField } from "@/components/ui/NumberField";
import { formatApiText } from "@/lib/apiText";
import { formatFlow, formatLength, formatPressure } from "../format";
import { HAZARD_LABELS, UNITS } from "../labels";
import { stepNumber } from "../schema";
import type { StepProps } from "../stepProps";
import type { RemoteAreaPlanResponse } from "../types";

function formatArea(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** One line of the working: what was done, and the figure that came out of it. */
function Line({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-zinc-200 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        <div className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{children}</div>
      </div>
    </li>
  );
}

function PlanWorking({ plan }: { plan: RemoteAreaPlanResponse }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {/* The answer first -- the working is there to be checked, not read before the number. */}
      <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Sprinklers in the remote area
        </p>
        <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
          {plan.totalSprinklers}
        </p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          {plan.sprinklersPerBranch} per branch line on {plan.branchLines} branch line
          {plan.branchLines === 1 ? "" : "s"}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        <Line n={1} label="Area to protect">
          {plan.reductionApplied ? (
            <>
              {formatArea(plan.baseDesignAreaSqFt)} {UNITS.area} reduced by{" "}
              {formatLength(plan.reductionPercent)}% for quick-response sprinklers to{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatArea(plan.adjustedDesignAreaSqFt)} {UNITS.area}
              </strong>
              .
            </>
          ) : (
            <>
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatArea(plan.adjustedDesignAreaSqFt)} {UNITS.area}
              </strong>
              , the design area from step {stepNumber("project")}, with no reduction.
            </>
          )}
        </Line>

        <Line n={2} label="Shape of the remote area">
          {formatLength(plan.remoteAreaLengthFt)} {UNITS.length} along the branch lines by{" "}
          {formatLength(plan.remoteAreaWidthFt)} {UNITS.length} across them.
        </Line>

        <Line n={3} label="Area each sprinkler covers">
          {formatArea(plan.coveragePerSprinklerSqFt)} {UNITS.area}, the spacing along the branch
          times the spacing between branches.
        </Line>

        <Line n={4} label="Sprinklers per branch line">
          {formatLength(plan.remoteAreaLengthFt)} {UNITS.length} divided by the spacing, rounded up
          to{" "}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            {plan.sprinklersPerBranch}
          </strong>
          .
        </Line>

        <Line n={5} label="Branch lines and total">
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            {plan.branchLines}
          </strong>{" "}
          branch line{plan.branchLines === 1 ? "" : "s"} to cover the area, so{" "}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            {plan.totalSprinklers}
          </strong>{" "}
          sprinklers protecting {formatArea(plan.totalProtectedAreaSqFt)} {UNITS.area}. The counts
          round up, so this is never less than the area in step {stepNumber("project")}.
        </Line>

        <Line n={6} label="Pressure at the first sprinkler">
          {formatFlow(plan.minimumFlowPerSprinklerGpm)} {UNITS.flow} over one sprinkler&apos;s
          coverage needs {formatPressure(plan.pressureForMinimumFlowPsi)} {UNITS.pressure}.{" "}
          {plan.floorGoverned ? (
            <>
              That is below the {formatPressure(plan.minimumOperatingPressurePsi)} {UNITS.pressure}{" "}
              minimum operating pressure, so{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatPressure(plan.firstSprinklerPressurePsi)} {UNITS.pressure}
              </strong>{" "}
              is used and the sprinkler discharges {formatFlow(plan.firstSprinklerFlowGpm)}{" "}
              {UNITS.flow}.
            </>
          ) : (
            <>
              That is above the {formatPressure(plan.minimumOperatingPressurePsi)} {UNITS.pressure}{" "}
              minimum operating pressure, so it is used as it stands:{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatPressure(plan.firstSprinklerPressurePsi)} {UNITS.pressure}
              </strong>
              .
            </>
          )}
        </Line>
      </ol>

      {plan.warnings.length > 0 && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
            {plan.warnings.map((warning) => (
              <li key={warning}>{formatApiText(warning)}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.reductionApplied && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-zinc-500 dark:text-zinc-400">
          {plan.notes
            .filter((note) => note.startsWith("Reduction read from"))
            .map((note) => (
              <li key={note}>{formatApiText(note)}</li>
            ))}
        </ul>
      )}
    </div>
  );
}

/**
 * How many sprinklers make up the remote area, and where the first one starts.
 *
 * Everything here is worked out by calc-core, not by this component: the 1.2 x sqrt(area)
 * dimension, rounding the counts up, the quick-response reduction and the minimum operating
 * pressure. This only collects four figures and lays the API's working out in order.
 *
 * Nothing on this step blocks the hydraulic calculation. It guides how many sprinklers to list in
 * the pipe network; the calculation itself takes whatever is listed.
 */
export function RemoteAreaStep({ form, reference, plan }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const quickResponse = watch("quickResponseSprinklers");
  const hazard = watch("hazard");
  const ceiling = watch("ceilingHeightFt");
  const needsCeiling = quickResponse && (ceiling === undefined || String(ceiling).trim() === "");
  const preset = reference.hazardPresets.find((entry) => entry.hazard === hazard);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Before drawing the network, work out how many sprinklers the remote area needs. Give the
        spacing the sprinklers will be laid out at, and the working below follows from the design
        area and density in step {stepNumber("project")}.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Sprinkler spacing along a branch line"
          unit={UNITS.length}
          hint="Distance between neighbouring sprinklers on the same branch."
          error={errors.sprinklerSpacingFt?.message}
          {...register("sprinklerSpacingFt")}
        />
        <NumberField
          label="Spacing between branch lines"
          unit={UNITS.length}
          hint="Distance between one branch line and the next."
          error={errors.branchSpacingFt?.message}
          {...register("branchSpacingFt")}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            {...register("quickResponseSprinklers")}
          />
          Quick-response sprinklers
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          NFPA 13 allows the design area to be reduced for quick-response sprinklers, by an amount
          that depends on the ceiling height, and gives none above a certain height. The reduction
          taken appears in the working below. The conditions attached to it are in the text of the
          standard and are not checked here — confirm them before relying on the reduced area.
        </p>
        {quickResponse && (
          <NumberField
            label="Ceiling height"
            unit={UNITS.length}
            hint={needsCeiling ? "Needed to read the reduction." : undefined}
            error={errors.ceilingHeightFt?.message}
            {...register("ceilingHeightFt")}
          />
        )}
      </div>

      {preset && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {HAZARD_LABELS[hazard] ?? preset.label}: one sprinkler may cover up to{" "}
          {preset.maxCoverageSqFtPerSprinkler} {UNITS.area} (Table 10.2.4.2.1) — spacing wider than
          that is flagged below.
        </p>
      )}

      {plan.error != null && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          The remote area plan could not be worked out.{" "}
          {plan.error instanceof Error ? formatApiText(plan.error.message) : null}
        </div>
      )}

      {plan.result ? (
        <div className="flex flex-col gap-2">
          {/* Dimmed alone says nothing: when the figures above no longer match, say so, and say
              what the plan is waiting for. */}
          {plan.isStale && !plan.isCalculating && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {needsCeiling
                ? "Showing the plan without the quick-response reduction — enter the ceiling height to apply it."
                : "Showing the last plan worked out — it updates once the figures above are complete."}
            </p>
          )}
          <div className={plan.isStale || plan.isCalculating ? "opacity-60" : ""}>
            <PlanWorking plan={plan.result} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {plan.isCalculating
            ? "Working it out…"
            : `Enter both spacings and the plan appears here. It also needs the design area and density from step ${stepNumber("project")} and the K factor from step ${stepNumber("design")}.`}
        </p>
      )}
    </div>
  );
}
