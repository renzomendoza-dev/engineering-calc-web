"use client";

import { useEffect, useMemo } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { usePipeMaterials } from "@/hooks/usePipeMaterials";
import { RAW_DIAMETER_UNITS } from "@/lib/diameterSpec";

const rawDiameterUnitOptions: SelectOption[] = RAW_DIAMETER_UNITS.map((value) => ({
  value,
  label: value,
}));

interface DiameterSpecFieldErrors {
  nominalMaterial?: { message?: string };
  nominalSize?: { message?: string };
  rawDiameterValue?: { message?: string };
  rawDiameterUnit?: { message?: string };
}

interface DiameterSpecInputProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors?: FieldErrors<T>;
}

/**
 * Standard-pipe-size-vs-custom-diameter input, shared by every calculator that sends the same
 * DiameterSpec discriminated shape to its API (pipe velocity, pipe pressure loss). Requires the
 * parent form to include the diameterSpecFields shape from lib/diameterSpec.ts.
 *
 * Generic over the parent's form values type; field paths are cast via `Path<T>` since two
 * different parent form shapes share this component — same pragmatic escape hatch used by
 * PumpCurvePointsInput for the same reason.
 */
export function DiameterSpecInput<T extends FieldValues>({
  register,
  watch,
  setValue,
  errors,
}: DiameterSpecInputProps<T>) {
  const { materials, isLoading: referenceLoading, error: referenceError } = usePipeMaterials();

  const diameterSource = watch("diameterSource" as Path<T>) as unknown as "standard" | "custom";
  const nominalMaterial = watch("nominalMaterial" as Path<T>) as unknown as string | undefined;
  const nominalSchedule = watch("nominalSchedule" as Path<T>) as unknown as string | undefined;

  const selectedMaterial = materials.find((m) => m.material === nominalMaterial);
  const scheduleOptions = useMemo(() => selectedMaterial?.schedules ?? [], [selectedMaterial]);
  const selectedSchedule = scheduleOptions.find((s) => s.schedule === nominalSchedule);
  const sizeOptions = selectedSchedule?.sizes ?? [];

  // Most materials (GI/BI/uPVC) publish a single schedule -- auto-select it rather than
  // making the user pick from a one-item dropdown. PPR (multiple schedules) still requires
  // an explicit choice.
  useEffect(() => {
    if (scheduleOptions.length === 1 && nominalSchedule !== scheduleOptions[0].schedule) {
      setValue("nominalSchedule" as Path<T>, scheduleOptions[0].schedule as never);
    }
  }, [scheduleOptions, nominalSchedule, setValue]);

  // Changing material invalidates whatever size was selected under the previous material.
  useEffect(() => {
    setValue("nominalSize" as Path<T>, "" as never);
  }, [nominalMaterial, setValue]);

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const materialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...materials.map((m) => ({ value: m.material, label: m.materialName })),
  ];
  const scheduleSelectOptions: SelectOption[] = [
    { value: "", label: "Select a schedule" },
    ...scheduleOptions.map((s) => ({ value: s.schedule, label: s.schedule })),
  ];
  const sizeSelectOptions: SelectOption[] = [
    { value: "", label: "Select a size" },
    ...sizeOptions.map((s) => ({ value: s.nominalSize, label: s.nominalLabel })),
  ];

  const showPlaceholderNotice = selectedMaterial?.confidence === "placeholder";
  const fieldErrors = (errors ?? {}) as DiameterSpecFieldErrors;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="standard" className="h-4 w-4" {...register("diameterSource" as Path<T>)} />
          Standard pipe size
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="custom" className="h-4 w-4" {...register("diameterSource" as Path<T>)} />
          Custom diameter
        </label>
      </div>

      {diameterSource === "standard" ? (
        <div className="flex flex-col gap-4">
          {referenceError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Couldn&apos;t load pipe reference data ({referenceError}).
            </div>
          )}
          <SelectField
            label="Material"
            options={materialOptions}
            disabled={referenceFieldsDisabled}
            error={fieldErrors.nominalMaterial?.message}
            {...register("nominalMaterial" as Path<T>)}
          />
          {showPlaceholderNotice && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Using generic reference data — verify for critical designs.
            </p>
          )}
          {scheduleOptions.length > 1 && (
            <SelectField
              label="Schedule"
              options={scheduleSelectOptions}
              {...register("nominalSchedule" as Path<T>)}
            />
          )}
          <SelectField
            label="Nominal Size"
            options={sizeSelectOptions}
            disabled={referenceFieldsDisabled || !nominalMaterial || !nominalSchedule}
            error={fieldErrors.nominalSize?.message}
            {...register("nominalSize" as Path<T>)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Diameter"
            error={fieldErrors.rawDiameterValue?.message}
            {...register("rawDiameterValue" as Path<T>)}
          />
          <SelectField
            label="Unit"
            options={rawDiameterUnitOptions}
            error={fieldErrors.rawDiameterUnit?.message}
            {...register("rawDiameterUnit" as Path<T>)}
          />
        </div>
      )}
    </div>
  );
}
