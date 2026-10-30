"use client";

import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatApiText } from "@/lib/apiText";
import { CONFIDENCE_LABELS, HAZARD_LABELS, SYSTEM_TYPE_LABELS, UNITS } from "../labels";
import { DesignBasisReadout } from "../PlanReadouts";
import { defaultStorageDurationMinutes } from "../pumpStorage";
import type { StepProps } from "../stepProps";
import { SPRINKLER_HAZARDS, SPRINKLER_SYSTEM_TYPES, type SprinklerHazard } from "../types";
import { stepNumber } from "../schema";

const SYSTEM_TYPE_OPTIONS = SPRINKLER_SYSTEM_TYPES.map((value) => ({
  value,
  label: SYSTEM_TYPE_LABELS[value],
}));

/**
 * Step 1: the design basis. Picking a hazard classification fills the density, design area, hose
 * stream allowance and coverage per sprinkler from the published preset table — on the change
 * event only, so a figure the user typed afterwards is never silently overwritten. All four stay
 * editable, because the API takes them as given values rather than deriving them from the hazard.
 *
 * The coverage per sprinkler is one figure for the whole remote area: it is applied to every
 * sprinkler in the pipe network, and with the density it fixes what each one flows. The readout
 * below it, and the quick-response reduction, come from the API (see PlanReadouts).
 */
export function ProjectHazardStep({ form, reference, plan }: StepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const hazard = watch("hazard");
  const quickResponse = watch("quickResponseSprinklers");
  const ceiling = watch("ceilingHeightFt");
  const needsCeiling = quickResponse && (ceiling === undefined || String(ceiling).trim() === "");
  const { hazardPresets, isLoading, error } = reference;

  const hazardOptions: SelectOption[] = SPRINKLER_HAZARDS.map((value) => ({
    value,
    // The table publishes its own label; these maps cover the window before it loads.
    label: hazardPresets.find((preset) => preset.hazard === value)?.label ?? HAZARD_LABELS[value],
  }));

  const preset = hazardPresets.find((entry) => entry.hazard === hazard);
  const hazardRegistration = register("hazard");

  function applyPreset(next: string) {
    // The storage duration starts at the lowest of the hazard's range. It comes from the storage
    // table's ranges, not the preset (which carries the top of each range), so it follows the hazard
    // even before the preset table has loaded.
    if ((SPRINKLER_HAZARDS as readonly string[]).includes(next)) {
      setValue("storageDurationMinutes", String(defaultStorageDurationMinutes(next as SprinklerHazard)), {
        shouldValidate: true,
      });
    }
    const match = hazardPresets.find((entry) => entry.hazard === next);
    if (!match) return;
    setValue("densityGpmPerSqFt", match.densityGpmPerSqFt, { shouldValidate: true });
    setValue("designAreaSqFt", match.designAreaSqFt, { shouldValidate: true });
    setValue("hoseStreamGpm", match.hoseStreamGpm, { shouldValidate: true });
    // The published maximum is the starting point; the designer's actual spacing replaces it.
    setValue("coveragePerSprinklerSqFt", match.maxCoverageSqFtPerSprinkler, { shouldValidate: true });
  }

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="Project name"
        hint="For your own reference — not part of the calculation."
        error={errors.projectName?.message}
        {...register("projectName")}
      />

      <RadioGroupField
        legend="System type"
        options={SYSTEM_TYPE_OPTIONS}
        hint={`Dry and preaction systems normally use a lower pipe C factor than a wet system (step ${stepNumber("design")}).`}
        {...register("systemType")}
      />

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the hazard preset table ({error}). You can still type the design
          figures below.
        </div>
      )}

      <SelectField
        label="Hazard classification"
        options={hazardOptions}
        disabled={isLoading}
        hint="Selecting a hazard fills in the design figures below. You can override any of them."
        error={errors.hazard?.message}
        {...hazardRegistration}
        onChange={(event) => {
          hazardRegistration.onChange(event);
          applyPreset(event.target.value as SprinklerHazard);
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Design density"
          unit={UNITS.density}
          error={errors.densityGpmPerSqFt?.message}
          {...register("densityGpmPerSqFt")}
        />
        <NumberField
          label="Design area of operation"
          unit={UNITS.area}
          hint="Before any quick-response reduction."
          error={errors.designAreaSqFt?.message}
          {...register("designAreaSqFt")}
        />
        <NumberField
          label="Coverage per sprinkler"
          unit={UNITS.area}
          hint={
            preset
              ? `The area each sprinkler protects, applied to every sprinkler in step ${stepNumber("network")}. This hazard allows up to ${preset.maxCoverageSqFtPerSprinkler} ${UNITS.area}.`
              : `The area each sprinkler protects, applied to every sprinkler in step ${stepNumber("network")}.`
          }
          error={errors.coveragePerSprinklerSqFt?.message}
          {...register("coveragePerSprinklerSqFt")}
        />
        <NumberField
          label="Hose stream allowance"
          unit={UNITS.flow}
          hint={`Added at the hose stream node (step ${stepNumber("network")}). Enter 0 if no allowance applies.`}
          error={errors.hoseStreamGpm?.message}
          {...register("hoseStreamGpm")}
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
          taken appears in the design basis below. The conditions attached to it are in the text of
          the standard and are not checked here — confirm them before relying on the reduced area.
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

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Design basis</h3>
        {plan.error != null && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
          >
            The design basis could not be worked out.{" "}
            {plan.error instanceof Error ? formatApiText(plan.error.message) : null}
          </div>
        )}
        {needsCeiling && plan.result && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing the figures without the quick-response reduction — enter the ceiling height to
            apply it.
          </p>
        )}
        <DesignBasisReadout plan={plan} />
      </section>

      {preset && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">{preset.label} — published values</p>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt>Water supply duration</dt>
              <dd>
                {preset.durationMinutes} {UNITS.duration}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Max coverage per sprinkler</dt>
              <dd>
                {preset.maxCoverageSqFtPerSprinkler} {UNITS.area}
              </dd>
            </div>
          </dl>
          {/* Duration is published alongside the preset but is not an input to this calculation.
              The maximum coverage is the starting value of the coverage per sprinkler above and
              the limit the plan checks it against. */}
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            The duration is shown for reference only; it is not used in the hydraulic calculation.
            {preset.confidence !== "verified" &&
              ` ${CONFIDENCE_LABELS[preset.confidence] ?? preset.confidence}.`}
          </p>
          {preset.sourceNote && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {formatApiText(preset.sourceNote)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
