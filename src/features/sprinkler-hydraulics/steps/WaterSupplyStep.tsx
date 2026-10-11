"use client";

import Link from "next/link";
import { NumberField } from "@/components/ui/NumberField";
import { UNITS } from "../labels";
import type { StepProps } from "../stepProps";

/**
 * Step 3. The three figures a flow test gives, which the API turns into the supply curve the
 * demand is compared against.
 *
 * The wording says source rather than tank on purpose. calc-core's SupplyCurve is only
 * P(Q) = Ps - (Ps - Pr)(Q/Qr)^1.85: it has no idea whether a main, a pump or a tank produces that
 * curve, and it knows nothing about stored volume or how long the supply can hold up. Volume and
 * duration belong to the fire water storage calculator, which is why that pointer is here.
 *
 * The cistern note isn't padding: a source at or below the riser has no pressure to offer, and
 * staticPressurePsi is @Positive, so such a tank cannot be entered at all — it has to be read as
 * the pump it feeds. That substitution is also where the curve stops being exact, since the
 * 1.85 water-supply law is not the shape of a pump curve, hence the pointer to the fire pump
 * calculator, which validates against real curve points.
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
      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Enter the flow test for whatever supplies the system —{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">
            a city main, an elevated tank, or a fire pump&apos;s discharge
          </strong>{" "}
          — measured at the point your system connects to it. It has to be a source with pressure
          of its own: the static pressure below must be above zero.
        </p>
        <p>
          For an elevated or gravity tank, the static pressure is the elevation head at that
          connection, and the residual is measured with the test flow running, so it already
          includes the losses between the tank and the connection.
        </p>
        <p>
          A <strong className="font-medium text-zinc-700 dark:text-zinc-300">cistern or
          underground tank</strong> is not a supply on its own — at the riser it has no pressure
          to give. It feeds a fire pump, so the pump&apos;s discharge is what goes here, and the
          curve between your two points follows the water-supply law rather than the shape of a
          pump curve: it is exact only at the static and residual points you enter. Check a
          candidate pump against its published curve in{" "}
          <Link
            href="/mechanical/firepump"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Fire Pump sizing
          </Link>
          , and work out the lift out of the cistern in{" "}
          <Link
            href="/mechanical/pump/tdh"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Pump TDH
          </Link>
          .
        </p>
      </div>

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

      <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          Height between the supply and the sprinklers is not entered here — it goes in as each
          pipe segment&apos;s elevation change in step 4.
        </p>
        <p>
          This step is about pressure at a flow, not how much water there is. Nothing here checks
          that the supply can hold up for the hazard&apos;s duration — for stored volume, use the{" "}
          <Link
            href="/mechanical/storage/fire"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Fire Water Storage calculator
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
