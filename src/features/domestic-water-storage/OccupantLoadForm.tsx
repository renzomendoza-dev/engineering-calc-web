"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { occupantLoadSchema, type OccupantLoadFormInput, type OccupantLoadFormValues } from "./schema";
import { OCCUPANCY_TYPES, type DomesticWaterStorageRequest, type DomesticWaterStorageResponse } from "./types";

const occupancyTypeOptions: SelectOption[] = [
  { value: "", label: "Select occupancy type" },
  ...OCCUPANCY_TYPES.map((type) => ({ value: type.value, label: type.label })),
];

const defaultValues: OccupantLoadFormInput = {
  occupantCount: 0,
  occupancyType: "",
  storageDurationHours: 0,
  safetyMarginPercent: 0,
};

interface OccupantLoadFormProps {
  onResult: (result: DomesticWaterStorageResponse) => void;
}

export function OccupantLoadForm({ onResult }: OccupantLoadFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OccupantLoadFormInput, unknown, OccupantLoadFormValues>({
    resolver: zodResolver(occupantLoadSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: OccupantLoadFormValues) => {
    setGeneralError(null);

    const request: DomesticWaterStorageRequest = {
      demandBasis: "OCCUPANT_LOAD",
      occupantCount: values.occupantCount,
      occupancyType: values.occupancyType,
      totalFixtureUnits: null,
      systemType: null,
      storageDurationHours: values.storageDurationHours,
      safetyMarginPercent: values.safetyMarginPercent,
    };

    try {
      const result = await apiPost<DomesticWaterStorageRequest, DomesticWaterStorageResponse>(
        "/api/mechanical/storage/domestic",
        request,
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <NumberField
        label="Occupant Count"
        error={errors.occupantCount?.message}
        {...register("occupantCount")}
      />

      <SelectField
        label="Occupancy Type"
        options={occupancyTypeOptions}
        error={errors.occupancyType?.message}
        {...register("occupancyType")}
      />
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        Per-capita consumption figures here are a generic international placeholder, not yet
        confirmed against a Philippine-specific code — verify for critical designs.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Storage Duration"
          unit="hours"
          error={errors.storageDurationHours?.message}
          {...register("storageDurationHours")}
        />
        <NumberField
          label="Safety Margin"
          unit="%"
          hint="Leave at 0 for no added margin."
          error={errors.safetyMarginPercent?.message}
          {...register("safetyMarginPercent")}
        />
      </div>

      {generalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {generalError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Calculating…" : "Calculate"}
      </button>
    </form>
  );
}
