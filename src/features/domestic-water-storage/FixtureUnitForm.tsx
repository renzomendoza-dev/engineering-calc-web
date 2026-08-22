"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { fixtureUnitSchema, type FixtureUnitFormInput, type FixtureUnitFormValues } from "./schema";
import type { DomesticWaterStorageRequest, DomesticWaterStorageResponse } from "./types";

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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">System Type</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="FLUSH_TANK" className="h-4 w-4" {...register("systemType")} />
            Predominantly flush tanks
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="FLUSH_VALVE" className="h-4 w-4" {...register("systemType")} />
            Predominantly flushometer valves
          </label>
        </div>
      </div>

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
