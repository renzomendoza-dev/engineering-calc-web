"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { ventAreaSchema, type VentAreaFormInput, type VentAreaFormValues } from "./schema";
import type { VentAreaRequest, VentAreaResponse } from "./types";

interface VentAreaFormProps {
  onResult: (result: VentAreaResponse, request: VentAreaRequest) => void;
  /** Pre-fill from a smoke production page's "Send to Vent Sizing" link. */
  initialVolumetricFlowRate?: string;
  initialSmokeTemperature?: string;
  initialAmbientTemperature?: string;
}

export function VentAreaForm({
  onResult,
  initialVolumetricFlowRate,
  initialSmokeTemperature,
  initialAmbientTemperature,
}: VentAreaFormProps) {
  const defaultValues: VentAreaFormInput = {
    volumetricFlowRate: initialVolumetricFlowRate ? Number(initialVolumetricFlowRate) : 0,
    smokeTemperature: initialSmokeTemperature ? Number(initialSmokeTemperature) : 0,
    ambientTemperature: initialAmbientTemperature ? Number(initialAmbientTemperature) : 0,
    ventHeight: 0,
    dischargeCoefficient: undefined,
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VentAreaFormInput, unknown, VentAreaFormValues>({
    resolver: zodResolver(ventAreaSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: VentAreaFormValues) => {
    setGeneralError(null);

    const request: VentAreaRequest = {
      volumetricFlowRate: values.volumetricFlowRate,
      smokeTemperature: values.smokeTemperature,
      ambientTemperature: values.ambientTemperature,
      ventHeight: values.ventHeight,
      dischargeCoefficient: values.dischargeCoefficient ?? null,
    };

    try {
      const result = await apiPost<VentAreaRequest, VentAreaResponse>("/api/smoke-control/vent-area", request);
      onResult(result, request);
    } catch (err) {
      // A forwarded smoke temperature evaluated early in a t-squared growth curve can be at
      // or below ambient -- calc-core's "deltaT must be positive" CalculationException
      // surfaces as-is via handleApiError's generalError banner, same as every other
      // domain-validation error in this app.
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Smoke Volumetric Flow Rate (V)"
          unit="m³/s"
          error={errors.volumetricFlowRate?.message}
          {...register("volumetricFlowRate")}
        />
        <NumberField
          label="Vent Height (H)"
          unit="m"
          hint="Height from the smoke layer to the vent."
          error={errors.ventHeight?.message}
          {...register("ventHeight")}
        />
        <NumberField
          label="Smoke Temperature (Ts)"
          unit="°C"
          error={errors.smokeTemperature?.message}
          {...register("smokeTemperature")}
        />
        <NumberField
          label="Ambient Temperature (To)"
          unit="°C"
          error={errors.ambientTemperature?.message}
          {...register("ambientTemperature")}
        />
      </div>

      <NumberField
        label="Discharge Coefficient (Cd)"
        placeholder="0.6 (default)"
        hint="Leave blank to use the typical discharge coefficient for natural smoke vents."
        error={errors.dischargeCoefficient?.message}
        {...register("dischargeCoefficient")}
      />

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
