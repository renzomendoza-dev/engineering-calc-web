"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { capacitySchema, type CapacityFormInput, type CapacityFormValues } from "./schema";
import type { FirePumpCapacityRequest, FirePumpCapacityResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface CapacityFormProps {
  onResult: (result: FirePumpCapacityResponse) => void;
  /** Pre-fill from Page 1's "Use this in Capacity Resolution" link, e.g. ?ratedFlow=550. */
  initialRatedFlow?: string;
}

export function CapacityForm({ onResult, initialRatedFlow }: CapacityFormProps) {
  const defaultValues: CapacityFormInput = {
    ratedFlowGpm: initialRatedFlow ? Number(initialRatedFlow) : 0,
  };
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CapacityFormInput, unknown, CapacityFormValues>({
    resolver: zodResolver(capacitySchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: CapacityFormValues) => {
    setGeneralError(null);

    const request: FirePumpCapacityRequest = { ratedFlowGpm: values.ratedFlowGpm };

    try {
      const result = await apiPost<FirePumpCapacityRequest, FirePumpCapacityResponse>(
        "/api/mechanical/firepump/capacity",
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
        label="Rated Flow (GPM)"
        hint="The flow you need a standard-size pump for — typically the rated flow from the Demand calculator."
        error={errors.ratedFlowGpm?.message}
        {...register("ratedFlowGpm")}
      />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} label="Resolve" submittingLabel="Resolving…" />
    </form>
  );
}
