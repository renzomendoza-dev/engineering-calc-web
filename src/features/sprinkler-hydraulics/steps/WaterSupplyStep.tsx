"use client";

import Link from "next/link";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { UNITS } from "../labels";
import { SupplyPipeRunsInput } from "../SupplyPipeRunsInput";
import type { StepProps } from "../stepProps";
import { stepNumber } from "../schema";

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
const SOURCE_OPTIONS = [
  { value: "FLOW_TEST", label: "City main or flow-tested source" },
  { value: "GRAVITY_TANK", label: "Elevated or gravity tank" },
  { value: "NONE", label: "Cistern, ground tank, or not decided yet" },
] as const;

export function WaterSupplyStep({ form, materials, materialsLoading }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const source = watch("supplySource");

  return (
    <div className="flex flex-col gap-6">
      <RadioGroupField
        legend="Where does the water come from?"
        options={SOURCE_OPTIONS}
        emphasizeOptions
        {...register("supplySource")}
      />
      {source === "FLOW_TEST" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter the flow test measured at the point your system connects to the supply — a city
          main, or a fire pump whose discharge you are describing by two points. For a pump, note
          that the curve drawn between them follows the water-supply law rather than the shape of
          a pump curve, so check a candidate against its published curve in{" "}
          <Link
            href="/mechanical/firepump"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Fire Pump sizing
          </Link>
          .
        </p>
      )}

      {source === "GRAVITY_TANK" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A tank above the sprinklers needs no flow test: its pressure is its height, and the
            pipe down to the connection is what takes that pressure away as flow rises. Measure
            the height from the system&apos;s connection point up to the tank&apos;s water level —
            the lowest level it is allowed to fall to, not the full tank.
          </p>
          <NumberField
            label="Water level above the connection"
            unit={UNITS.length}
            hint="0.433 psi per foot. A tank at or below the connection has no pressure to give there — choose the third option instead."
            error={errors.gravityTank?.waterLevelHeightFt?.message}
            {...register("gravityTank.waterLevelHeightFt")}
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Pipe from the tank to the connection
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Optional, but leaving it out credits the full height at every flow, which reads
              better than the system will perform — the calculation says so when you do.
            </p>
            <SupplyPipeRunsInput form={form} materials={materials} materialsLoading={materialsLoading} />
          </div>
        </div>
      )}

      {source === "NONE" && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p>
            A cistern or ground-level tank has no pressure at the riser, so there is nothing to
            enter here. The calculation still runs: it gives the demand flow and the pressure the
            system needs, which is exactly what a pump has to meet — but no margin and no pass or
            fail verdict, because there is nothing yet to compare against.
          </p>
          <p>
            Take those two figures to{" "}
            <Link
              href="/mechanical/firepump"
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Fire Pump sizing
            </Link>{" "}
            to check a pump against its real curve, and work out the lift out of the tank in{" "}
            <Link
              href="/mechanical/pump/tdh"
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Pump TDH
            </Link>
            .
          </p>
        </div>
      )}

      {/* Unmounted rather than hidden for the other sources: useApiFormError decides whether an
          API field error can be shown inline by looking the input up in the DOM, so a field that
          is present but invisible would swallow the message. */}
      {source === "FLOW_TEST" && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Static pressure"
          unit={UNITS.pressure}
          hint="With no flow."
          tooltip="Read from a cap gauge on the hydrant nearest your connection, with nothing flowing. It applies at that hydrant's elevation: correct it by 0.433 psi per foot if your connection sits higher or lower."
          error={errors.waterSupply?.staticPressurePsi?.message}
          {...register("waterSupply.staticPressurePsi")}
        />
        <NumberField
          label="Residual pressure"
          unit={UNITS.pressure}
          hint="Measured while the test flow below is running."
          tooltip="Read from the same gauge while a second, downstream hydrant is flowing. Flow enough to pull the pressure at least 25% below static — a small drop fits the curve to almost nothing. Most authorities want a test less than a year old, and some require a derate before you design to it."
          error={errors.waterSupply?.residualPressurePsi?.message}
          {...register("waterSupply.residualPressurePsi")}
        />
        <NumberField
          label="Flow at residual pressure"
          unit={UNITS.flow}
          hint="The flow that was running during the test."
          tooltip="Measured at the flowing hydrant with a pitot gauge: Q = 29.83 × c × d² × √p, where d is the outlet diameter in inches, p the pitot pressure in psi, and c is 0.9 for a smooth outlet, 0.8 square-edged, 0.7 projecting. A diffuser with a built-in meter reads it directly."
          error={errors.waterSupply?.flowAtResidualGpm?.message}
          {...register("waterSupply.flowAtResidualGpm")}
        />
      </div>
      )}

      <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          Height between the supply and the sprinklers is not entered here — it goes in as each
          pipe segment&apos;s elevation change in step {stepNumber("network")}.
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
