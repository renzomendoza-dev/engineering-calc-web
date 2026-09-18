"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { usePipeMaterials } from "@/hooks/usePipeMaterials";
import {
  sizePipeSchema,
  FLOW_RATE_UNITS,
  TARGET_VELOCITY_UNITS,
  type SizePipeFormInput,
  type SizePipeFormValues,
} from "./schema";
import type { PipeVelocityRequest, PipeVelocityResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));
const targetVelocityUnitOptions: SelectOption[] = TARGET_VELOCITY_UNITS.map((value) => ({ value, label: value }));

const defaultValues: SizePipeFormInput = {
  flowRateValue: 0,
  flowRateUnit: "gpm",
  targetVelocityValue: 0,
  targetVelocityUnit: "ft/s",
  pipeMaterial: "",
  schedule: "",
};

interface SizePipeFormProps {
  onResult: (result: PipeVelocityResponse) => void;
}

export function SizePipeForm({ onResult }: SizePipeFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SizePipeFormInput, unknown, SizePipeFormValues>({
    resolver: zodResolver(sizePipeSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const { materials, isLoading: referenceLoading, error: referenceError } = usePipeMaterials();

  const pipeMaterial = watch("pipeMaterial");
  const schedule = watch("schedule");

  const selectedMaterial = materials.find((m) => m.material === pipeMaterial);
  const scheduleOptions = useMemo(() => selectedMaterial?.schedules ?? [], [selectedMaterial]);

  // Auto-select the material's only schedule when it has exactly one; clear a stale
  // selection left over from a previously-chosen material otherwise.
  useEffect(() => {
    if (scheduleOptions.length === 1 && schedule !== scheduleOptions[0].schedule) {
      setValue("schedule", scheduleOptions[0].schedule);
    } else if (scheduleOptions.length !== 1 && !scheduleOptions.some((s) => s.schedule === schedule)) {
      setValue("schedule", "");
    }
  }, [scheduleOptions, schedule, setValue]);

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const materialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...materials.map((m) => ({ value: m.material, label: m.materialName })),
  ];
  const scheduleSelectOptions: SelectOption[] = [
    { value: "", label: "Select a schedule" },
    ...scheduleOptions.map((s) => ({ value: s.schedule, label: s.schedule })),
  ];

  const showPlaceholderNotice = selectedMaterial?.confidence === "placeholder";

  const onSubmit = async (values: SizePipeFormValues) => {
    setGeneralError(null);

    const request: PipeVelocityRequest = {
      mode: "DIAMETER_FROM_VELOCITY",
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      diameterSpecType: null,
      nominalMaterial: null,
      nominalSchedule: null,
      nominalLabel: null,
      rawDiameterValue: null,
      rawDiameterUnit: null,
      targetVelocityValue: values.targetVelocityValue,
      targetVelocityUnit: values.targetVelocityUnit,
      pipeMaterial: values.pipeMaterial,
      schedule: values.schedule || null,
    };

    try {
      const result = await apiPost<PipeVelocityRequest, PipeVelocityResponse>(
        "/api/mechanical/pipe-velocity",
        request,
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Flow Rate" error={errors.flowRateValue?.message} {...register("flowRateValue")} />
        <SelectField
          label="Flow Rate Unit"
          options={flowRateUnitOptions}
          error={errors.flowRateUnit?.message}
          {...register("flowRateUnit")}
        />
        <NumberField
          label="Target Velocity"
          error={errors.targetVelocityValue?.message}
          {...register("targetVelocityValue")}
        />
        <SelectField
          label="Target Velocity Unit"
          options={targetVelocityUnitOptions}
          error={errors.targetVelocityUnit?.message}
          {...register("targetVelocityUnit")}
        />
      </div>

      {referenceError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load pipe reference data ({referenceError}).
        </div>
      )}
      <SelectField
        label="Material"
        options={materialOptions}
        disabled={referenceFieldsDisabled}
        error={errors.pipeMaterial?.message}
        {...register("pipeMaterial")}
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
          error={errors.schedule?.message}
          {...register("schedule")}
        />
      )}

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
