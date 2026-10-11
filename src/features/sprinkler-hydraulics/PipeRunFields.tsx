"use client";

import { get } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { UNITS } from "./labels";
import { materialOptions, scheduleOptions, sizeOptions } from "./pipeOptions";
import { PipeFittingsInput } from "./PipeFittingsInput";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow } from "./types";

/** A single concrete shape to type run-time paths against; see PipeFittingsInput for why. */
type RunField<K extends string> = `network.riser.${number}.${K}`;

interface PipeRunFieldsProps {
  form: SprinklerForm;
  /** Where this pipe lives in the form, e.g. "network.branches.0.crossMain". */
  basePath: string;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: FittingEquivalentLengthTableRow[];
  /** Names the pipe in accessible labels, e.g. "branch 1, sprinkler 2". */
  describedAs: string;
}

/**
 * The fields of one run of pipe: size, length, rise and fittings, with material, schedule and C
 * factor tucked under "Pipe details" because they come from step 2 and rarely change.
 *
 * Used for every pipe in the network -- the one after each sprinkler, each cross main, each riser
 * run -- so they are entered the same way. It knows its own path and nothing about where it
 * connects: that is the network's structure, not something to type here.
 */
export function PipeRunFields({
  form,
  basePath,
  materials,
  materialsLoading,
  fittings,
  describedAs,
}: PipeRunFieldsProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const at = <K extends string>(key: K) => `${basePath}.${key}` as RunField<K>;
  const errorOf = (key: string) =>
    (get(errors, `${basePath}.${key}`) as { message?: string } | undefined)?.message;

  const material = watch(at("pipeMaterial")) as string;
  const schedule = watch(at("schedule")) as string | undefined;

  const materialRegistration = register(at("pipeMaterial"));
  const scheduleRegistration = register(at("schedule"));

  const materialSelectOptions: SelectOption[] = materialsLoading
    ? [{ value: material, label: "Loading…" }]
    : materialOptions(materials);
  const scheduleSelectOptions = scheduleOptions(materials, material);
  const sizeSelectOptions = sizeOptions(materials, material, schedule);

  /**
   * Keeps the chosen size when the new material or schedule also has it, and otherwise falls back
   * to the first size it does have, so a pipe never holds a size the API would reject.
   */
  function keepSizeValid(nextMaterial: string, nextSchedule: string | undefined) {
    const sizes = sizeOptions(materials, nextMaterial, nextSchedule);
    const current = watch(at("nominalSize")) as string;
    if (!sizes.some((size) => size.value === current)) {
      setValue(at("nominalSize"), sizes[0]?.value ?? "", { shouldValidate: true });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Nominal size"
          options={sizeSelectOptions}
          disabled={materialsLoading || sizeSelectOptions.length === 0}
          error={errorOf("nominalSize")}
          {...register(at("nominalSize"))}
        />
        <NumberField
          label="Pipe length"
          unit={UNITS.length}
          hint="Centerline, including any vertical run."
          error={errorOf("pipeLengthFt")}
          {...register(at("pipeLengthFt"))}
        />
        <NumberField
          label="Rise"
          unit={UNITS.length}
          hint="Up is positive, down negative."
          error={errorOf("elevationChangeFt")}
          {...register(at("elevationChangeFt"))}
        />
      </div>

      <PipeFittingsInput form={form} basePath={basePath} fittings={fittings} describedAs={describedAs} />

      <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Pipe details — material, schedule and C factor
        </summary>
        <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 p-3 sm:grid-cols-3 dark:border-zinc-800">
          <SelectField
            label="Pipe material"
            options={materialSelectOptions}
            disabled={materialsLoading}
            error={errorOf("pipeMaterial")}
            {...materialRegistration}
            onChange={(event) => {
              materialRegistration.onChange(event);
              // Schedules belong to a material, so the old one may not exist under the new one.
              const nextSchedule = scheduleOptions(materials, event.target.value)[0]?.value ?? "";
              setValue(at("schedule"), nextSchedule, { shouldValidate: true });
              keepSizeValid(event.target.value, nextSchedule);
            }}
          />
          <SelectField
            label="Schedule"
            options={scheduleSelectOptions}
            disabled={materialsLoading || scheduleSelectOptions.length === 0}
            error={errorOf("schedule")}
            {...scheduleRegistration}
            onChange={(event) => {
              scheduleRegistration.onChange(event);
              keepSizeValid(material, event.target.value);
            }}
          />
          <NumberField
            label="C factor"
            error={errorOf("cFactor")}
            {...register(at("cFactor"))}
          />
        </div>
      </details>
    </div>
  );
}
