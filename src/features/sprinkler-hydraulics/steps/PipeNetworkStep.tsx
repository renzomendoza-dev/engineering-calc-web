"use client";

import { TextField } from "@/components/ui/TextField";
import { UNITS } from "../labels";
import { DeviceLossRowsInput } from "../DeviceLossRowsInput";
import { SegmentRowsInput } from "../SegmentRowsInput";
import { SprinklerRowsInput } from "../SprinklerRowsInput";
import type { StepProps } from "../stepProps";

/**
 * Step 4. The network itself, as tables rather than a drawing canvas: sprinklers, the pipe
 * segments joining them to the supply, any device losses, and the node the hose stream allowance
 * is taken at.
 */
export function PipeNetworkStep({ form, reference, materials, materialsLoading }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const hoseStreamGpm = Number(watch("hoseStreamGpm"));

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
              ? `The ${hoseStreamGpm} ${UNITS.flow} allowance from step 1 is added at this node.`
              : "Not needed while the hose stream allowance in step 1 is 0."
          }
          error={errors.hoseStreamNodeId?.message}
          {...register("hoseStreamNodeId")}
        />
      </section>
    </div>
  );
}
