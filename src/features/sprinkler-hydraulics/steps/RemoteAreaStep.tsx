"use client";

import type { ReactNode } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { formatApiText } from "@/lib/apiText";
import { formatArea, formatLength, formatPressure } from "../format";
import { UNITS } from "../labels";
import { stepNumber } from "../schema";
import type { StepProps } from "../stepProps";
import type { RemoteAreaPlanResponse } from "../types";

/** One line of the working: what was done, and the figure that came out of it. */
function Line({ n, label, children }: { n: number; label: string; children: ReactNode }) {
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

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{children}</strong>;
}

/**
 * The layout working. `plan` here always has its layout fields: the caller only renders this once
 * the spacing was given and the API returned them.
 */
function LayoutWorking({
  plan,
  perBranch,
  branchLines,
  total,
  protectedArea,
  branchSpacing,
}: {
  plan: RemoteAreaPlanResponse;
  perBranch: number;
  branchLines: number;
  total: number;
  protectedArea: number;
  branchSpacing: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {/* The answer first -- the working is there to be checked, not read before the number. */}
      <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-center dark:border-blue-500 dark:bg-blue-950/40">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Sprinklers in the remote area
        </p>
        <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          {perBranch} per branch line on {branchLines} branch line{branchLines === 1 ? "" : "s"}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        <Line n={1} label="Area to protect">
          <Strong>
            {formatArea(plan.adjustedDesignAreaSqFt)} {UNITS.area}
          </Strong>
          {plan.reductionApplied
            ? `, after the ${formatLength(plan.reductionPercent)}% quick-response reduction from ${formatArea(plan.baseDesignAreaSqFt)} ${UNITS.area}.`
            : `, the design area from step ${stepNumber("project")}, with no reduction.`}
        </Line>

        <Line n={2} label="Shape of the remote area">
          {formatLength(plan.remoteAreaLengthFt)} {UNITS.length} along the branch lines by{" "}
          {formatLength(plan.remoteAreaWidthFt)} {UNITS.length} across them.
        </Line>

        <Line n={3} label="Sprinklers per branch line">
          {formatLength(plan.remoteAreaLengthFt)} {UNITS.length} divided by the spacing, rounded up
          to <Strong>{perBranch}</Strong>.
        </Line>

        <Line n={4} label="Branch lines and total">
          <Strong>{branchLines}</Strong> branch line{branchLines === 1 ? "" : "s"} to cover the area,
          so <Strong>{total}</Strong> sprinklers protecting {formatArea(protectedArea)} {UNITS.area}.
          The counts round up, so this is never less than the area to protect. The branch lines are{" "}
          {formatLength(branchSpacing)} {UNITS.length} apart, which is the coverage per sprinkler
          over the spacing along the branch.
        </Line>
      </ol>
    </div>
  );
}

/**
 * How the remote area is laid out: how many sprinklers per branch line, how many branch lines, and
 * so how many sprinklers in all.
 *
 * Everything on screen is worked out by calc-core, not by this component: the 1.2 x sqrt(area)
 * dimension, rounding the counts up, and the spacing between branches that follows from the
 * coverage. This only collects the one figure the layout needs -- the spacing along a branch --
 * and lays the API's working out in order.
 *
 * The area, flow per sprinkler and starting pressure are in the first two steps; this is the part
 * that needs the spacing. Nothing here blocks the hydraulic calculation. It guides how many
 * sprinklers to list in the pipe network; the calculation itself takes whatever is listed.
 */
export function RemoteAreaStep({ form, plan }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const result = plan.result;
  // The layout fields are all null until the spacing was sent, and all present after; narrowing
  // them together here means the working below never has to guess.
  const layout =
    result !== null &&
    result.sprinklersPerBranch !== null &&
    result.branchLines !== null &&
    result.totalSprinklers !== null &&
    result.totalProtectedAreaSqFt !== null &&
    result.branchSpacingFt !== null
      ? {
          perBranch: result.sprinklersPerBranch,
          branchLines: result.branchLines,
          total: result.totalSprinklers,
          protectedArea: result.totalProtectedAreaSqFt,
          branchSpacing: result.branchSpacingFt,
        }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Before drawing the network, work out how many sprinklers the remote area needs. The area and
        what each sprinkler flows are already known from the design basis in step{" "}
        {stepNumber("project")}; the layout needs one more figure, the spacing the sprinklers will
        have along a branch line.
      </p>

      <div className="max-w-sm">
        <NumberField
          label="Sprinkler spacing along a branch line"
          unit={UNITS.length}
          hint="Distance between neighbouring sprinklers on one branch. The distance between branch lines follows from the coverage per sprinkler."
          error={errors.sprinklerSpacingFt?.message}
          {...register("sprinklerSpacingFt")}
        />
      </div>

      {plan.error != null && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          The remote area plan could not be worked out.{" "}
          {plan.error instanceof Error ? formatApiText(plan.error.message) : null}
        </div>
      )}

      {result && layout ? (
        <div className="flex flex-col gap-2">
          {/* Dimmed alone says nothing: when the figures above no longer match, say so. */}
          {plan.isStale && !plan.isCalculating && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing the last plan worked out — it updates once the figures are complete.
            </p>
          )}
          <div className={plan.isStale || plan.isCalculating ? "opacity-60" : ""}>
            <LayoutWorking plan={result} {...layout} />
          </div>
          {result.warnings.length > 0 && (
            <div
              role="status"
              className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
            >
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
                {result.warnings.map((warning) => (
                  <li key={warning}>{formatApiText(warning)}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The starting pressure of {formatPressure(result.firstSprinklerPressurePsi)}{" "}
            {UNITS.pressure} is in step {stepNumber("design")}.
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {plan.isCalculating
            ? "Working it out…"
            : result
              ? "Enter the spacing along a branch line and the layout appears here."
              : `Fill in the design area, density and coverage in step ${stepNumber("project")}, then the spacing here, and the layout appears.`}
        </p>
      )}
    </div>
  );
}
