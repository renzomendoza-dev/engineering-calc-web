"use client";

import { NumberField } from "@/components/ui/NumberField";
import { UNITS } from "../labels";
import type { StepProps } from "../stepProps";

/**
 * Step 3. The three figures a flow test gives, which the API turns into the supply curve the
 * demand is compared against.
 *
 * There is deliberately no supply-elevation field: the request has none. Height between the
 * supply point and the sprinklers is entered as each segment's elevation change in step 4.
 */
export function WaterSupplyStep({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Enter the results of the water supply flow test at the point the system connects to.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Static pressure"
          unit={UNITS.pressure}
          hint="With no flow."
          error={errors.waterSupply?.staticPressurePsi?.message}
          {...register("waterSupply.staticPressurePsi")}
        />
        <NumberField
          label="Residual pressure"
          unit={UNITS.pressure}
          hint="Measured while the test flow below is running."
          error={errors.waterSupply?.residualPressurePsi?.message}
          {...register("waterSupply.residualPressurePsi")}
        />
        <NumberField
          label="Flow at residual pressure"
          unit={UNITS.flow}
          hint="The flow that was running during the test."
          error={errors.waterSupply?.flowAtResidualGpm?.message}
          {...register("waterSupply.flowAtResidualGpm")}
        />
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Height between the supply and the sprinklers is not entered here — it goes in as each pipe
        segment&apos;s elevation change in step 4.
      </p>
    </div>
  );
}
