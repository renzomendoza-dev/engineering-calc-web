"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import {
  tSquaredSmokePlumeSchema,
  type TSquaredSmokePlumeFormInput,
  type TSquaredSmokePlumeFormValues,
} from "./schema";
import type { TSquaredSmokeProductionRequest, TSquaredSmokeProductionResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const defaultValues: TSquaredSmokePlumeFormInput = {
  fireGrowthRate: 0,
  cappingHRR: 0,
  evaluationTime: 0,
  convectiveFraction: undefined,
  ceilingHeight: 0,
  fireBaseHeight: 0,
  ambientTemperature: 0,
  fractionConvectiveHeatInSmokeLayer: undefined,
};

interface TSquaredSmokePlumeFormProps {
  onResult: (result: TSquaredSmokeProductionResponse, request: TSquaredSmokeProductionRequest) => void;
}

export function TSquaredSmokePlumeForm({ onResult }: TSquaredSmokePlumeFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TSquaredSmokePlumeFormInput, unknown, TSquaredSmokePlumeFormValues>({
    resolver: zodResolver(tSquaredSmokePlumeSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: TSquaredSmokePlumeFormValues) => {
    setGeneralError(null);

    const request: TSquaredSmokeProductionRequest = {
      fireGrowthRate: values.fireGrowthRate,
      cappingHRR: values.cappingHRR,
      evaluationTime: values.evaluationTime,
      convectiveFraction: values.convectiveFraction ?? null,
      ceilingHeight: values.ceilingHeight,
      fireBaseHeight: values.fireBaseHeight ?? null,
      ambientTemperature: values.ambientTemperature,
      fractionConvectiveHeatInSmokeLayer: values.fractionConvectiveHeatInSmokeLayer ?? null,
    };

    try {
      const result = await apiPost<TSquaredSmokeProductionRequest, TSquaredSmokeProductionResponse>(
        "/api/smoke-control/plume-tsquared",
        request,
      );
      onResult(result, request);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fire Growth</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Fire Growth Rate (α)"
            unit="kW/s²"
            error={errors.fireGrowthRate?.message}
            {...register("fireGrowthRate")}
          />
          <NumberField
            label="Capping Heat Release Rate (Qcap)"
            unit="kW"
            error={errors.cappingHRR?.message}
            {...register("cappingHRR")}
          />
          <NumberField
            label="Evaluation Time (t)"
            unit="s"
            hint="The single point in time being evaluated — not a duration or time series."
            error={errors.evaluationTime?.message}
            {...register("evaluationTime")}
          />
        </div>
        <NumberField
          label="Convective Fraction (χ)"
          placeholder="0.7 (default)"
          hint="Leave blank to use the default convective fraction for flaming combustion."
          error={errors.convectiveFraction?.message}
          {...register("convectiveFraction")}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Geometry &amp; Ambient</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Ceiling Height"
            unit="m"
            error={errors.ceilingHeight?.message}
            {...register("ceilingHeight")}
          />
          <NumberField
            label="Fire Base Height"
            unit="m"
            hint="Height of the fire's base above the reference floor plane. Defaults to 0 (floor-level fire)."
            error={errors.fireBaseHeight?.message}
            {...register("fireBaseHeight")}
          />
          <NumberField
            label="Ambient Temperature (To)"
            unit="°C"
            error={errors.ambientTemperature?.message}
            {...register("ambientTemperature")}
          />
          <NumberField
            label="Fraction of Convective Heat in Smoke Layer (Ks)"
            placeholder="1.0 (default)"
            hint="Leave blank to use the default assumption for an unobstructed plume."
            error={errors.fractionConvectiveHeatInSmokeLayer?.message}
            {...register("fractionConvectiveHeatInSmokeLayer")}
          />
        </div>
      </div>

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
