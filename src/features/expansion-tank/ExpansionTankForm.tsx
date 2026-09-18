"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { expansionTankSchema, type ExpansionTankFormInput, type ExpansionTankFormValues } from "./schema";
import type { ExpansionTankRequest, ExpansionTankResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const defaultValues: ExpansionTankFormInput = {
  systemType: "DOMESTIC_WATER_HEATER",
  primaryVesselVolumeLiters: 0,
  estimatedPipingLengthMeters: 0,
  averagePipeDiameterMm: 0,
  additionalVolumeFactor: undefined,
  coldWaterTemperatureCelsius: 10,
  hotWaterTemperatureCelsius: 60,
  fillPressureGaugeKpa: 0,
  maxOperatingPressureGaugeKpa: 0,
  altitudeMeters: 0,
};

interface ExpansionTankFormProps {
  onResult: (result: ExpansionTankResponse, request: ExpansionTankRequest) => void;
}

export function ExpansionTankForm({ onResult }: ExpansionTankFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpansionTankFormInput, unknown, ExpansionTankFormValues>({
    resolver: zodResolver(expansionTankSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const systemType = watch("systemType");
  const vesselVolumeLabel =
    systemType === "HYDRONIC_HEATING" ? "Boiler Water Content" : "Water Heater Tank Volume";

  const onSubmit = async (values: ExpansionTankFormValues) => {
    setGeneralError(null);

    const request: ExpansionTankRequest = {
      systemType: values.systemType,
      primaryVesselVolumeLiters: values.primaryVesselVolumeLiters,
      estimatedPipingLengthMeters: values.estimatedPipingLengthMeters,
      averagePipeDiameterMm: values.averagePipeDiameterMm,
      additionalVolumeFactor: values.additionalVolumeFactor ?? null,
      coldWaterTemperatureCelsius: values.coldWaterTemperatureCelsius,
      hotWaterTemperatureCelsius: values.hotWaterTemperatureCelsius,
      fillPressureGaugeKpa: values.fillPressureGaugeKpa,
      maxOperatingPressureGaugeKpa: values.maxOperatingPressureGaugeKpa,
      altitudeMeters: values.altitudeMeters,
    };

    try {
      const result = await apiPost<ExpansionTankRequest, ExpansionTankResponse>(
        "/api/mechanical/tank/expansion",
        request,
      );
      onResult(result, request);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <RadioGroupField
        legend="System Type"
        options={[
          { value: "DOMESTIC_WATER_HEATER", label: "Domestic Water Heater" },
          { value: "HYDRONIC_HEATING", label: "Hydronic Heating" },
        ]}
        {...register("systemType")}
      />

      <NumberField
        label={`${vesselVolumeLabel} (L)`}
        error={errors.primaryVesselVolumeLiters?.message}
        {...register("primaryVesselVolumeLiters")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Estimated Piping Length"
          unit="m"
          error={errors.estimatedPipingLengthMeters?.message}
          {...register("estimatedPipingLengthMeters")}
        />
        <NumberField
          label="Average Pipe Diameter"
          unit="mm"
          error={errors.averagePipeDiameterMm?.message}
          {...register("averagePipeDiameterMm")}
        />
      </div>
      <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        A rough estimate of piping&apos;s contribution to total system volume, not a precise
        take-off.
      </p>

      <NumberField
        label="Additional Volume Factor"
        hint="Optional, defaults to 1.0. Accounts for fittings/terminal units not captured by the piping estimate above."
        error={errors.additionalVolumeFactor?.message}
        {...register("additionalVolumeFactor")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Cold Water Temperature"
          unit="°C"
          hint="Reference data currently covers water from 0-100 °C."
          error={errors.coldWaterTemperatureCelsius?.message}
          {...register("coldWaterTemperatureCelsius")}
        />
        <NumberField
          label="Hot Water Temperature"
          unit="°C"
          hint="Reference data currently covers water from 0-100 °C."
          error={errors.hotWaterTemperatureCelsius?.message}
          {...register("hotWaterTemperatureCelsius")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Fill Pressure"
          unit="kPa"
          error={errors.fillPressureGaugeKpa?.message}
          {...register("fillPressureGaugeKpa")}
        />
        <NumberField
          label="Max Operating Pressure"
          unit="kPa"
          error={errors.maxOperatingPressureGaugeKpa?.message}
          {...register("maxOperatingPressureGaugeKpa")}
        />
      </div>
      <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        These come from the specific water heater&apos;s relief valve / PRV setting, or the
        hydronic system&apos;s design pressure — not a code table.
      </p>

      <NumberField
        label="Altitude"
        unit="m"
        hint="Affects the gauge-to-absolute pressure conversion used internally."
        error={errors.altitudeMeters?.message}
        {...register("altitudeMeters")}
      />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
