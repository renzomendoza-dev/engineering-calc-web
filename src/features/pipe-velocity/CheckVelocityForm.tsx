"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { DiameterSpecInput } from "@/components/DiameterSpecInput";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { toDiameterSpecRequest } from "@/lib/diameterSpec";
import {
  checkVelocitySchema,
  FLOW_RATE_UNITS,
  type CheckVelocityFormInput,
  type CheckVelocityFormValues,
} from "./schema";
import type { PipeVelocityRequest, PipeVelocityResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

const defaultValues: CheckVelocityFormInput = {
  flowRateValue: 0,
  flowRateUnit: "gpm",
  diameterSource: "standard",
  nominalMaterial: "",
  nominalSchedule: "",
  nominalSize: "",
  rawDiameterValue: undefined,
  rawDiameterUnit: "mm",
};

interface CheckVelocityFormProps {
  onResult: (result: PipeVelocityResponse) => void;
}

export function CheckVelocityForm({ onResult }: CheckVelocityFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckVelocityFormInput, unknown, CheckVelocityFormValues>({
    resolver: zodResolver(checkVelocitySchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: CheckVelocityFormValues) => {
    setGeneralError(null);

    const request: PipeVelocityRequest = {
      mode: "VELOCITY_FROM_DIAMETER",
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      ...toDiameterSpecRequest(values),
      targetVelocityValue: null,
      targetVelocityUnit: null,
      pipeMaterial: null,
      schedule: null,
    };

    try {
      const result = await apiPost<PipeVelocityRequest, PipeVelocityResponse>(
        "/api/mechanical/pipe-velocity",
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
        <NumberField label="Flow Rate" error={errors.flowRateValue?.message} {...register("flowRateValue")} />
        <SelectField
          label="Flow Rate Unit"
          options={flowRateUnitOptions}
          error={errors.flowRateUnit?.message}
          {...register("flowRateUnit")}
        />
      </div>

      <DiameterSpecInput register={register} watch={watch} setValue={setValue} errors={errors} />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
