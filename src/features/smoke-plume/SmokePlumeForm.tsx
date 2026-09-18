"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { smokePlumeSchema, type SmokePlumeFormInput, type SmokePlumeFormValues } from "./schema";
import type { SmokeProductionRequest, SmokeProductionResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const defaultValues: SmokePlumeFormInput = {
  designFireArea: 0,
  heatReleaseRateDensity: 0,
  convectiveFraction: undefined,
  ceilingHeight: 0,
  fireBaseHeight: 0,
  ambientTemperature: 0,
  fractionConvectiveHeatInSmokeLayer: undefined,
};

interface SmokePlumeFormProps {
  onResult: (result: SmokeProductionResponse, request: SmokeProductionRequest) => void;
}

export function SmokePlumeForm({ onResult }: SmokePlumeFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SmokePlumeFormInput, unknown, SmokePlumeFormValues>({
    resolver: zodResolver(smokePlumeSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: SmokePlumeFormValues) => {
    setGeneralError(null);

    const request: SmokeProductionRequest = {
      designFireArea: values.designFireArea,
      heatReleaseRateDensity: values.heatReleaseRateDensity,
      convectiveFraction: values.convectiveFraction ?? null,
      ceilingHeight: values.ceilingHeight,
      fireBaseHeight: values.fireBaseHeight ?? null,
      ambientTemperature: values.ambientTemperature,
      fractionConvectiveHeatInSmokeLayer: values.fractionConvectiveHeatInSmokeLayer ?? null,
    };

    try {
      const result = await apiPost<SmokeProductionRequest, SmokeProductionResponse>(
        "/api/smoke-control/plume",
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
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fire Scenario</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Design Fire Area (A)"
            unit="m²"
            error={errors.designFireArea?.message}
            {...register("designFireArea")}
          />
          <NumberField
            label="Heat Release Rate Density (HRR)"
            unit="kW/m²"
            error={errors.heatReleaseRateDensity?.message}
            {...register("heatReleaseRateDensity")}
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
