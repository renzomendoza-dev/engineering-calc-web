"use client";

import type { ReactNode } from "react";
import { formatArea, formatLength } from "./format";
import { UNITS } from "./labels";
import { stepNumber } from "./schema";
import type { RemoteAreaPlanResponse } from "./types";

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
 * The layout working: how many sprinklers on a branch line, how many branch lines, and so how many
 * in all. Every figure is the API's; this only lays its working out in order.
 *
 * `plan` here always has its layout fields: the caller only renders this once the spacing was
 * given and the API returned them.
 */
export function LayoutWorking({
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
          <Strong>{branchLines}</Strong> branch line{branchLines === 1 ? "" : "s"} to cover the
          area, so <Strong>{total}</Strong> sprinklers protecting {formatArea(protectedArea)}{" "}
          {UNITS.area}. The counts round up, so this is never less than the area to protect. The
          branch lines are {formatLength(branchSpacing)} {UNITS.length} apart, which is the coverage
          per sprinkler over the spacing along the branch.
        </Line>
      </ol>
    </div>
  );
}
