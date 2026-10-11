"use client";

import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatApiText } from "@/lib/apiText";
import { CONFIDENCE_LABELS, HAZARD_LABELS, SYSTEM_TYPE_LABELS, UNITS } from "../labels";
import type { StepProps } from "../stepProps";
import { SPRINKLER_HAZARDS, SPRINKLER_SYSTEM_TYPES, type SprinklerHazard } from "../types";
import { stepNumber } from "../schema";

const SYSTEM_TYPE_OPTIONS = SPRINKLER_SYSTEM_TYPES.map((value) => ({
  value,
  label: SYSTEM_TYPE_LABELS[value],
}));

/**
 * Step 1. Picking a hazard classification fills the density, design area and hose stream
 * allowance from the published preset table — on the change event only, so a figure the user
 * typed afterwards is never silently overwritten. All three stay editable, because the API takes
 * them as given values rather than deriving them from the hazard.
 */
export function ProjectHazardStep({ form, reference }: StepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const hazard = watch("hazard");
  const { hazardPresets, isLoading, error } = reference;

  const hazardOptions: SelectOption[] = SPRINKLER_HAZARDS.map((value) => ({
    value,
    // The table publishes its own label; these maps cover the window before it loads.
    label: hazardPresets.find((preset) => preset.hazard === value)?.label ?? HAZARD_LABELS[value],
  }));

  const preset = hazardPresets.find((entry) => entry.hazard === hazard);
  const hazardRegistration = register("hazard");

  function applyPreset(next: string) {
    const match = hazardPresets.find((entry) => entry.hazard === next);
    if (!match) return;
    setValue("densityGpmPerSqFt", match.densityGpmPerSqFt, { shouldValidate: true });
    setValue("designAreaSqFt", match.designAreaSqFt, { shouldValidate: true });
    setValue("hoseStreamGpm", match.hoseStreamGpm, { shouldValidate: true });
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
        hint="Selecting a hazard fills in the three design figures below. You can override any of them."
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
          error={errors.designAreaSqFt?.message}
          {...register("designAreaSqFt")}
        />
        <NumberField
          label="Hose stream allowance"
          unit={UNITS.flow}
          hint={`Added at the hose stream node (step ${stepNumber("network")}). Enter 0 if no allowance applies.`}
          error={errors.hoseStreamGpm?.message}
          {...register("hoseStreamGpm")}
        />
      </div>

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
          {/* Duration and max coverage are published alongside the preset but are not inputs to
              this calculation — shown so the designer can check their own layout against them. */}
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Shown for reference only; neither figure is used in the hydraulic calculation.
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
