"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { DiameterSpecInput } from "@/components/DiameterSpecInput";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { toDiameterSpecRequest } from "@/lib/diameterSpec";
import { FRICTION_FACTOR_METHOD_HINT, FRICTION_FACTOR_METHOD_OPTIONS } from "@/lib/frictionFactorMethod";
import { pressureLossSchema, FLOW_RATE_UNITS, type PressureLossFormInput, type PressureLossFormValues } from "./schema";
import { FLUIDS, type PipePressureLossRequest, type PipePressureLossResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const fluidOptions: SelectOption[] = FLUIDS.map((f) => ({ value: f.key, label: f.label }));
const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

const defaultValues: PressureLossFormInput = {
  fluidKey: FLUIDS[0].key,
  fluidTemperatureCelsius: 20,
  flowRateValue: 0,
  flowRateUnit: "L/s",
  diameterSource: "standard",
  nominalMaterial: "",
  nominalSchedule: "",
  nominalSize: "",
  rawDiameterValue: undefined,
  rawDiameterUnit: "mm",
  pipeLengthMeters: 0,
  method: "SWAMEE_JAIN",
};

interface PressureLossFormProps {
  onResult: (result: PipePressureLossResponse) => void;
}

export function PressureLossForm({ onResult }: PressureLossFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PressureLossFormInput, unknown, PressureLossFormValues>({
    resolver: zodResolver(pressureLossSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: PressureLossFormValues) => {
    setGeneralError(null);

    const request: PipePressureLossRequest = {
      fluidKey: values.fluidKey,
      fluidTemperatureCelsius: values.fluidTemperatureCelsius,
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      ...toDiameterSpecRequest(values),
      pipeLengthMeters: values.pipeLengthMeters,
      method: values.method,
    };

    try {
      const result = await apiPost<PipePressureLossRequest, PipePressureLossResponse>(
        "/api/mechanical/pipe-pressure-loss",
        request,
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

      <DiameterSpecInput register={register} watch={watch} setValue={setValue} errors={errors} />

      <NumberField
        label="Pipe Length (m)"
        error={errors.pipeLengthMeters?.message}
        {...register("pipeLengthMeters")}
      />

      <RadioGroupField
        legend="Friction Factor Method"
        options={FRICTION_FACTOR_METHOD_OPTIONS}
        hint={FRICTION_FACTOR_METHOD_HINT}
        {...register("method")}
      />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
