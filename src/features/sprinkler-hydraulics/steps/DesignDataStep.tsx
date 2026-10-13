"use client";

import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { CONFIDENCE_LABELS, humanizeCode, UNITS } from "../labels";
import { materialOptions, scheduleOptions } from "../pipeOptions";
import { StartingPressureReadout } from "../PlanReadouts";
import type { StepProps } from "../stepProps";
import { stepNumber } from "../schema";

interface QuickPicksProps {
  label: string;
  picks: { value: number; label: string }[];
  onPick: (value: number) => void;
}

/** Published values the user can drop into the field above, rather than retyping from a table. */
function QuickPicks({ label, picks, onPick }: QuickPicksProps) {
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      {picks.map((pick) => (
        <button
          key={pick.label}
          type="button"
          onClick={() => onPick(pick.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {pick.label}
        </button>
      ))}
    </div>
  );
}

/**
 * These are the defaults new pipe segments and sprinklers start from — every one of them
 * stays editable per row in the pipe network step, because the API requires a C factor and a size
 * on each segment and a K factor on each sprinkler.
 *
 * The starting pressure is shown here but not asked for: it is a consequence of the K factor and
 * the flow per sprinkler, so it is read out as calculated.
 */
export function DesignDataStep({ form, reference, materials, materialsLoading, plan }: StepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const systemType = watch("systemType");
  const material = watch("defaultPipeMaterial");
  const { kFactors, cFactors, error: referenceError } = reference;

  const materialSelectOptions: SelectOption[] = [
    ...(materialsLoading ? [{ value: material, label: "Loading…" }] : []),
    ...materialOptions(materials),
  ];
  const scheduleSelectOptions = scheduleOptions(materials, material);
  const selectedMaterial = materials.find((entry) => entry.material === material);

  const materialRegistration = register("defaultPipeMaterial");

  // C factor depends on the service: the table publishes WET/DRY/PREACTION rows for steel and
  // "ANY" for materials whose C doesn't change with the system type.
  const cFactorPicks = cFactors
    .filter((row) => row.systemType === systemType || row.systemType === "ANY")
    .map((row) => ({ value: row.cFactor, label: `${row.label} — ${row.cFactor}` }));

  const kFactorPicks = kFactors.map((row) => ({ value: row.nominalK, label: row.label }));

  const placeholderKFactors = kFactors.some((row) => row.confidence === "placeholder");

  return (
    <div className="flex flex-col gap-6">
      {referenceError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the K factor and C factor tables ({referenceError}). You can still
          type the values below.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <NumberField
          label="Default sprinkler K factor"
          hint={`Pre-fills new sprinklers in step ${stepNumber("network")}; each one can be changed there.`}
          error={errors.defaultKFactor?.message}
          {...register("defaultKFactor")}
        />
        <QuickPicks
          label="Published K factors:"
          picks={kFactorPicks}
          onPick={(value) => setValue("defaultKFactor", value, { shouldValidate: true })}
        />
        {placeholderKFactors && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {CONFIDENCE_LABELS.verify} — check the K factor against the sprinkler&apos;s listing.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Default pipe material"
          options={materialSelectOptions}
          disabled={materialsLoading}
          error={errors.defaultPipeMaterial?.message}
          {...materialRegistration}
          onChange={(event) => {
            materialRegistration.onChange(event);
            // Schedules are per material, so the old one may not exist under the new material.
            const next = scheduleOptions(materials, event.target.value)[0]?.value ?? "";
            setValue("defaultSchedule", next, { shouldValidate: true });
          }}
        />
        <SelectField
          label="Default pipe schedule"
          options={scheduleSelectOptions}
          disabled={materialsLoading || scheduleSelectOptions.length === 0}
          error={errors.defaultSchedule?.message}
          {...register("defaultSchedule")}
        />
      </div>
      {selectedMaterial && selectedMaterial.confidence !== "verified" && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          {humanizeCode(selectedMaterial.material)} dimensions:{" "}
          {CONFIDENCE_LABELS[selectedMaterial.confidence] ?? selectedMaterial.confidence}.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <NumberField
          label="Default Hazen-Williams C factor"
          hint={`Pre-fills new pipe segments in step ${stepNumber("network")}. The published values below are the ones that apply to the system type chosen in step ${stepNumber("project")}.`}
          error={errors.defaultCFactor?.message}
          {...register("defaultCFactor")}
        />
        <QuickPicks
          label="Published C factors:"
          picks={cFactorPicks}
          onPick={(value) => setValue("defaultCFactor", value, { shouldValidate: true })}
        />
      </div>

      <div className="max-w-sm">
        <NumberField
          label="Minimum operating pressure from the sprinkler listing (optional)"
          unit={UNITS.pressure}
          hint="NFPA 13 sets 7 psi for any sprinkler (27.2.4.11.1); where the listing for the application specifies more, that higher pressure is required (27.2.4.11.2). Leave blank for 7 psi. It can only raise the minimum, and it applies to every sprinkler."
          error={errors.listedMinimumPressurePsi?.message}
          {...register("listedMinimumPressurePsi")}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Starting pressure
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Worked out, not entered: the most remote sprinkler starts at the pressure its flow needs
            at this K factor, or the minimum operating pressure if that is lower. It follows the K
            factor above and the coverage and density in step {stepNumber("project")}.
          </p>
        </div>
        <StartingPressureReadout plan={plan} kFactor={String(watch("defaultKFactor") ?? "")} />
      </section>
    </div>
  );
}
