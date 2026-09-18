"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { fixtureUnitSchema, type FixtureUnitFormInput, type FixtureUnitFormValues } from "./schema";
import type { DomesticWaterStorageRequest, DomesticWaterStorageResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const defaultValues: FixtureUnitFormInput = {
  totalFixtureUnits: 0,
  systemType: "FLUSH_TANK",
  storageDurationHours: 0,
  safetyMarginPercent: 0,
};

interface FixtureUnitFormProps {
  onResult: (result: DomesticWaterStorageResponse) => void;
}

export function FixtureUnitForm({ onResult }: FixtureUnitFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FixtureUnitFormInput, unknown, FixtureUnitFormValues>({
    resolver: zodResolver(fixtureUnitSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: FixtureUnitFormValues) => {
    setGeneralError(null);

    const request: DomesticWaterStorageRequest = {
      demandBasis: "FIXTURE_UNIT",
      occupantCount: null,
      occupancyType: null,
      totalFixtureUnits: values.totalFixtureUnits,
      systemType: values.systemType,
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
        label="Total Fixture Units"
        hint="Total Water Supply Fixture Units (WSFU) for the system."
        error={errors.totalFixtureUnits?.message}
        {...register("totalFixtureUnits")}
      />

      <RadioGroupField
        legend="System Type"
        options={[
          { value: "FLUSH_TANK", label: "Predominantly flush tanks" },
          { value: "FLUSH_VALVE", label: "Predominantly flushometer valves" },
        ]}
        {...register("systemType")}
      />

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

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
