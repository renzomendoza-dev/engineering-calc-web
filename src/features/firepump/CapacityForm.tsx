"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { capacitySchema, type CapacityFormInput, type CapacityFormValues } from "./schema";
import type { FirePumpCapacityRequest, FirePumpCapacityResponse } from "./types";

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
        {isSubmitting ? "Resolving…" : "Resolve"}
      </button>
    </form>
  );
}
