"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import {
  fireWaterStorageSchema,
  type FireWaterStorageFormInput,
  type FireWaterStorageFormValues,
} from "./schema";
import {
  HAZARD_CLASSIFICATIONS,
  HAZARD_CLASSIFICATION_LABELS,
  HAZARD_DURATION_RANGES,
  type FireWaterStorageRequest,
  type FireWaterStorageResponse,
  type HazardClassification,
} from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const hazardClassificationOptions: SelectOption[] = HAZARD_CLASSIFICATIONS.map((value) => ({
  value,
  label: HAZARD_CLASSIFICATION_LABELS[value],
}));

interface FireWaterStorageFormProps {
  onResult: (result: FireWaterStorageResponse) => void;
  /** Pre-fill from the fire pump capacity page's future "use this in storage sizing" link. */
  initialRatedPumpFlow?: string;
}

export function FireWaterStorageForm({ onResult, initialRatedPumpFlow }: FireWaterStorageFormProps) {
  const defaultValues: FireWaterStorageFormInput = {
    ratedPumpFlowGpm: initialRatedPumpFlow ? Number(initialRatedPumpFlow) : 0,
    hazardClassification: "ORDINARY_HAZARD",
    selectedDurationMinutes: undefined,
    safetyMarginPercent: 0,
  };

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FireWaterStorageFormInput, unknown, FireWaterStorageFormValues>({
    resolver: zodResolver(fireWaterStorageSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const hazardClassification = watch("hazardClassification") as HazardClassification;
  const range = HAZARD_DURATION_RANGES[hazardClassification];
  const isFixedDuration = range.minMinutes === range.maxMinutes;

  const onSubmit = async (values: FireWaterStorageFormValues) => {
    setGeneralError(null);

    const request: FireWaterStorageRequest = {
      ratedPumpFlowGpm: values.ratedPumpFlowGpm,
      hazardClassification: values.hazardClassification,
      selectedDurationMinutes: values.selectedDurationMinutes ?? null,
      safetyMarginPercent: values.safetyMarginPercent,
    };

    try {
      const result = await apiPost<FireWaterStorageRequest, FireWaterStorageResponse>(
        "/api/mechanical/storage/fire",
        request,
      );
      onResult(result);
    } catch (err) {
      // Out-of-range selectedDurationMinutes surfaces via calc-core's CalculationException,
      // whose message states the valid range directly (e.g. "... must be between 60 and 90
      // minutes for ORDINARY_HAZARD") -- shown as-is by handleApiError's generalError banner,
      // same as every other domain-validation error in this app.
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <NumberField
        label="Rated Pump Flow"
        unit="GPM"
        hint="The fire pump's rated flow — typically forwarded from the Capacity Resolution calculator."
        error={errors.ratedPumpFlowGpm?.message}
        {...register("ratedPumpFlowGpm")}
      />

      <SelectField
        label="Hazard Classification"
        options={hazardClassificationOptions}
        error={errors.hazardClassification?.message}
        {...register("hazardClassification")}
      />

      {isFixedDuration ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {HAZARD_CLASSIFICATION_LABELS[hazardClassification]} requires {range.maxMinutes} minutes
          (fixed) — no range to select within.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {HAZARD_CLASSIFICATION_LABELS[hazardClassification]} requires{" "}
            {range.minMinutes}-{range.maxMinutes} minutes.
          </p>
          <NumberField
            label="Specific Duration"
            unit="minutes"
            hint="Optional — leave blank to use the conservative maximum automatically."
            error={errors.selectedDurationMinutes?.message}
            {...register("selectedDurationMinutes")}
          />
        </div>
      )}

      <NumberField
        label="Safety Margin"
        unit="%"
        hint="Leave at 0 for no added margin."
        error={errors.safetyMarginPercent?.message}
        {...register("safetyMarginPercent")}
      />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
