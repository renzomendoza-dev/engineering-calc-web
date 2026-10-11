"use client";

import { TextField } from "@/components/ui/TextField";
import { UNITS } from "../labels";
import { DeviceLossRowsInput } from "../DeviceLossRowsInput";
import { SegmentRowsInput } from "../SegmentRowsInput";
import { SprinklerRowsInput } from "../SprinklerRowsInput";
import type { StepProps } from "../stepProps";
import { stepNumber } from "../schema";

/**
 * Says how many sprinklers the remote area plan calls for against how many are listed.
 *
 * It exists because the hydraulic calculation counts only the sprinklers listed: fewer than the
 * plan means the demand is understated, and nothing else in the calculation would say so. A count
 * comparison only -- the plan itself, and every figure in it, comes from the API.
 */
function PlanCountNote({
  totalSprinklers,
  perBranch,
  branchLines,
  listed,
}: {
  totalSprinklers: number;
  perBranch: number;
  branchLines: number;
  listed: number;
}) {
  const matches = listed === totalSprinklers;
  const fewer = listed < totalSprinklers;
  return (
    <p
      role="status"
      className={`rounded-md border px-3 py-2 text-xs ${
        fewer
          ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      The remote area plan (step {stepNumber("remote")}) calls for {totalSprinklers} sprinklers —{" "}
      {perBranch} per branch line on {branchLines} branch line{branchLines === 1 ? "" : "s"}. You
      have listed {listed}.{" "}
      {matches
        ? "That matches the plan."
        : fewer
          ? "The demand counts only the sprinklers listed, so fewer than the plan understates it."
          : "That is more than the plan needs; the extra sprinklers add to the demand."}
    </p>
  );
}

/**
 * The network itself, as tables rather than a drawing canvas: sprinklers, the pipe
 * segments joining them to the supply, any device losses, and the node the hose stream allowance
 * is taken at.
 */
export function PipeNetworkStep({ form, reference, materials, materialsLoading, plan }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const hoseStreamGpm = Number(watch("hoseStreamGpm"));
  const listedSprinklers = watch("sprinklers").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Remote area sprinklers
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The flowing sprinklers in the hydraulically most demanding area.
          </p>
        </div>
        {plan.result && (
          <PlanCountNote
            totalSprinklers={plan.result.totalSprinklers}
            perBranch={plan.result.sprinklersPerBranch}
            branchLines={plan.result.branchLines}
            listed={listedSprinklers}
          />
        )}
        <SprinklerRowsInput form={form} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pipe segments</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            One row per pipe run, working from each sprinkler back towards the supply. Node ids tie
            the rows together — a segment&apos;s &ldquo;to&rdquo; node is the next segment&apos;s
            &ldquo;from&rdquo; node.
          </p>
        </div>
        <SegmentRowsInput
          form={form}
          materials={materials}
          materialsLoading={materialsLoading}
          fittings={reference.fittings}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Device losses</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Optional. Fixed losses through valves and devices, in {UNITS.pressure}.
          </p>
        </div>
        <DeviceLossRowsInput form={form} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hose stream</h3>
        <TextField
          label="Hose stream node id"
          hint={
            hoseStreamGpm > 0
              ? `The ${hoseStreamGpm} ${UNITS.flow} allowance from step ${stepNumber("project")} is added at this node.`
              : `Not needed while the hose stream allowance in step ${stepNumber("project")} is 0.`
          }
          error={errors.hoseStreamNodeId?.message}
          {...register("hoseStreamNodeId")}
        />
      </section>
    </div>
  );
}
