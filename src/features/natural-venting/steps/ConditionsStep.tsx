"use client";

import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { NaturalVentingInputDefaults } from "../labels";
import type { StepProps } from "../stepProps";

/**
 * Step 1: the project label, the ambient temperature, and the assumptions of the method. The
 * assumptions are optional and blank means the calculation's own default, shown as the field's
 * placeholder; they are filled in only to depart from it.
 */
export function ConditionsStep({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="Project name"
        hint="For your own reference. It is not part of the calculation."
        error={errors.projectName?.message}
        {...register("projectName")}
      />

      <NumberField
        label="Ambient temperature"
        unit="°C"
        hint="Design ambient air temperature To (Equation 9.2.4.3)."
        error={errors.ambientTemperature?.message}
        {...register("ambientTemperature")}
      />

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Assumptions of the method
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Leave blank to use the value in the placeholder. Change one only with a reason you can
            put in the report.
          </p>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <NumberField
            label="Growth constant"
            unit="kW"
            placeholder={String(NaturalVentingInputDefaults.growthConstant)}
            hint="Q = c (t/tg)². Clauses 8.3.1 and 8.3.5 print 1055; Annex A.8.3.2 and the Annex D sample problem use 1000."
            error={errors.growthConstant?.message}
            {...register("growthConstant")}
          />
          <NumberField
            label="Layer energy fraction K"
            placeholder={String(NaturalVentingInputDefaults.layerEnergyFraction)}
            hint="Fraction of the convected energy in the smoke layer (9.2.4.4). 0.5 unless the AHJ accepts an analysis for another value."
            error={errors.layerEnergyFraction?.message}
            {...register("layerEnergyFraction")}
          />
          <NumberField
            label="Specific heat of the smoke layer gases cp"
            unit="kJ/kg·K"
            placeholder={String(NaturalVentingInputDefaults.specificHeat)}
            error={errors.specificHeat?.message}
            {...register("specificHeat")}
          />
          <NumberField
            label="Ambient air density"
            unit="kg/m³"
            placeholder="from the ambient temperature"
            hint="Ideal-gas value at the ambient temperature when blank."
            error={errors.ambientDensity?.message}
            {...register("ambientDensity")}
          />
        </div>
      </section>
    </div>
  );
}
