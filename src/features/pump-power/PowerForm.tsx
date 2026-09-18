"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { powerSchema, FLOW_RATE_UNITS, type PowerFormInput, type PowerFormValues } from "./schema";
import type { PumpPowerRequest, PumpPowerResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

function isFlowRateUnit(value: string | undefined): value is (typeof FLOW_RATE_UNITS)[number] {
  return !!value && (FLOW_RATE_UNITS as readonly string[]).includes(value);
}

interface PowerFormProps {
  onResult: (result: PumpPowerResponse) => void;
  /** Pre-fill from the TDH page's "Use this TDH in power sizing" link. */
  initialFlowRateValue?: string;
  initialFlowRateUnit?: string;
  initialTdh?: string;
}

export function PowerForm({
  onResult,
  initialFlowRateValue,
  initialFlowRateUnit,
  initialTdh,
}: PowerFormProps) {
  const defaultValues: PowerFormInput = {
    flowRateValue: initialFlowRateValue ? Number(initialFlowRateValue) : 0,
    flowRateUnit: isFlowRateUnit(initialFlowRateUnit) ? initialFlowRateUnit : "L/s",
    totalDynamicHeadMeters: initialTdh ? Number(initialTdh) : 0,
    pumpEfficiencyPercent: 75,
    fluidDensityKgM3: 1000,
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PowerFormInput, unknown, PowerFormValues>({
    resolver: zodResolver(powerSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: PowerFormValues) => {
    setGeneralError(null);

    const request: PumpPowerRequest = {
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      totalDynamicHeadMeters: values.totalDynamicHeadMeters,
      pumpEfficiency: values.pumpEfficiencyPercent / 100,
      fluidDensityKgM3: values.fluidDensityKgM3,
    };

    try {
      const result = await apiPost<PumpPowerRequest, PumpPowerResponse>("/api/mechanical/pump/power", request);
      onResult(result);
    } catch (err) {
      // Non-positive TDH surfaces as a CalculationException 400 ("can't size a motor for
      // zero/negative head") -- shown inline via handleApiError's generalError banner, not a
      // raw API error.
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
      </div>

      <NumberField
        label="Total Dynamic Head"
        unit="m"
        error={errors.totalDynamicHeadMeters?.message}
        {...register("totalDynamicHeadMeters")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Pump Efficiency (%)"
          hint="From the manufacturer's curve or datasheet at the operating point (typically 60-85%)."
          error={errors.pumpEfficiencyPercent?.message}
          {...register("pumpEfficiencyPercent")}
        />
        <NumberField
          label="Fluid Density"
          unit="kg/m³"
          hint="Default 1000 kg/m³ is plain water."
          error={errors.fluidDensityKgM3?.message}
          {...register("fluidDensityKgM3")}
        />
      </div>

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
