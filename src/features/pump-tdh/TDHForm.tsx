"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { PipeSegmentListInput } from "@/components/PipeSegmentListInput";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { toDiameterSpecRequest } from "@/lib/diameterSpec";
import type { PipeSegmentFormValues } from "@/lib/pipeSegment";
import { FLUIDS } from "@/features/pipe-pressure-loss/types";
import { tdhSchema, FLOW_RATE_UNITS, type TdhFormInput, type TdhFormValues } from "./schema";
import { SUCTION_CONDITIONS, type PipeSegmentSpec, type PumpTDHRequest, type PumpTDHResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const fluidOptions: SelectOption[] = FLUIDS.map((f) => ({ value: f.key, label: f.label }));
const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

const SUCTION_LABELS: Record<(typeof SUCTION_CONDITIONS)[number], string> = {
  FLOODED: "Flooded",
  LIFT: "Lift",
};
const suctionOptions: SelectOption[] = SUCTION_CONDITIONS.map((value) => ({
  value,
  label: SUCTION_LABELS[value],
}));

const defaultValues: TdhFormInput = {
  fluidKey: FLUIDS[0].key,
  fluidTemperatureCelsius: 20,
  flowRateValue: 0,
  flowRateUnit: "L/s",
  suctionCondition: "FLOODED",
  staticSuctionHeadFloodedMeters: undefined,
  staticSuctionLiftMeters: undefined,
  suctionSegments: [],
  staticDischargeElevationMeters: 0,
  requiredResidualPressureKpa: 0,
  dischargeSegments: [],
  includeVelocityHead: false,
};

function toSegmentRequest(row: PipeSegmentFormValues): PipeSegmentSpec {
  return {
    ...toDiameterSpecRequest(row),
    lengthMeters: row.lengthMeters,
    method: row.method,
  };
}

interface TDHFormProps {
  onResult: (result: PumpTDHResponse, flowRateValue: number, flowRateUnit: string) => void;
}

export function TDHForm({ onResult }: TDHFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TdhFormInput, unknown, TdhFormValues>({
    resolver: zodResolver(tdhSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const suctionCondition = watch("suctionCondition");

  // Clear the other suction mode's field when toggling, so a stale value from the previously-
  // visible field never gets silently submitted -- same reasoning as fire pump demand's form.
  useEffect(() => {
    if (suctionCondition === "FLOODED") {
      setValue("staticSuctionLiftMeters", undefined);
    } else {
      setValue("staticSuctionHeadFloodedMeters", undefined);
    }
  }, [suctionCondition, setValue]);

  const onSubmit = async (values: TdhFormValues) => {
    setGeneralError(null);

    const request: PumpTDHRequest = {
      fluidKey: values.fluidKey,
      fluidTemperatureCelsius: values.fluidTemperatureCelsius,
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      suctionCondition: values.suctionCondition,
      staticSuctionHeadFloodedMeters:
        values.suctionCondition === "FLOODED" ? (values.staticSuctionHeadFloodedMeters ?? null) : null,
      staticSuctionLiftMeters:
        values.suctionCondition === "LIFT" ? (values.staticSuctionLiftMeters ?? null) : null,
      suctionSegments: values.suctionSegments.map(toSegmentRequest),
      staticDischargeElevationMeters: values.staticDischargeElevationMeters,
      requiredResidualPressureKpa: values.requiredResidualPressureKpa,
      dischargeSegments: values.dischargeSegments.map(toSegmentRequest),
      includeVelocityHead: values.includeVelocityHead,
    };

    try {
      const result = await apiPost<PumpTDHRequest, PumpTDHResponse>("/api/mechanical/pump/tdh", request);
      onResult(result, values.flowRateValue, values.flowRateUnit);
    } catch (err) {
      // CalculationException messages (e.g. a segment's fluid temperature out of range)
      // already say which side failed ("... for a discharge segment: ...") -- surfaced as-is
      // by handleApiError's generalError banner.
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Fluid"
          options={fluidOptions}
          error={errors.fluidKey?.message}
          {...register("fluidKey")}
        />
        <NumberField
          label="Fluid Temperature (°C)"
          hint="Reference data currently covers water from 0-100 °C."
          error={errors.fluidTemperatureCelsius?.message}
          {...register("fluidTemperatureCelsius")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Flow Rate" error={errors.flowRateValue?.message} {...register("flowRateValue")} />
        <SelectField
          label="Flow Rate Unit"
          options={flowRateUnitOptions}
          error={errors.flowRateUnit?.message}
          {...register("flowRateUnit")}
        />
      </div>

      <SelectField
        label="Suction Condition"
        hint="Flooded: the water source sits above the pump (positive suction head). Lift: the pump must draw water up from below."
        options={suctionOptions}
        error={errors.suctionCondition?.message}
        {...register("suctionCondition")}
      />

      {suctionCondition === "FLOODED" ? (
        <NumberField
          label="Available Suction Head"
          unit="m"
          error={errors.staticSuctionHeadFloodedMeters?.message}
          {...register("staticSuctionHeadFloodedMeters")}
        />
      ) : (
        <NumberField
          label="Suction Lift"
          unit="m"
          error={errors.staticSuctionLiftMeters?.message}
          {...register("staticSuctionLiftMeters")}
        />
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Suction Piping</h3>
        <PipeSegmentListInput
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          name="suctionSegments"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Discharge Elevation"
          unit="m"
          error={errors.staticDischargeElevationMeters?.message}
          {...register("staticDischargeElevationMeters")}
        />
        <NumberField
          label="Required Residual Pressure at Outlet"
          unit="kPa"
          error={errors.requiredResidualPressureKpa?.message}
          {...register("requiredResidualPressureKpa")}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Discharge Piping</h3>
        <PipeSegmentListInput
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          name="dischargeSegments"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700" {...register("includeVelocityHead")} />
          Include velocity head
        </label>
        <p className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
          Usually negligible for typical piping velocities — off by default, include only if you
          specifically need it accounted for.
        </p>
      </div>

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
