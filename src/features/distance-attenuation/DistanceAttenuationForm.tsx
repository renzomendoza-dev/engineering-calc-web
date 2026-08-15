"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import {
  distanceAttenuationSchema,
  type DistanceAttenuationFormInput,
  type DistanceAttenuationFormValues,
} from "./schema";
import type { DistanceAttenuationRequest, DistanceAttenuationResponse } from "./types";

const defaultValues: DistanceAttenuationFormInput = {
  referenceSplDb: 0,
  referenceDistance: 0,
  targetDistance: 0,
};

interface DistanceAttenuationFormProps {
  onResult: (result: DistanceAttenuationResponse, request: DistanceAttenuationRequest) => void;
}

export function DistanceAttenuationForm({ onResult }: DistanceAttenuationFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DistanceAttenuationFormInput, unknown, DistanceAttenuationFormValues>({
    resolver: zodResolver(distanceAttenuationSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const onSubmit = async (values: DistanceAttenuationFormValues) => {
    setGeneralError(null);

    const request: DistanceAttenuationRequest = {
      referenceSplDb: values.referenceSplDb,
      referenceDistance: values.referenceDistance,
      targetDistance: values.targetDistance,
    };

    try {
      const result = await apiPost<DistanceAttenuationRequest, DistanceAttenuationResponse>(
        "/api/acoustics/distance-attenuation",
        request,
      );
      onResult(result, request);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <NumberField
        label="Reference SPL"
        unit="dB"
        hint="Sound pressure level measured at the reference distance."
        error={errors.referenceSplDb?.message}
        {...register("referenceSplDb")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Reference Distance"
          unit="m"
          error={errors.referenceDistance?.message}
          {...register("referenceDistance")}
        />
        <NumberField
          label="Target Distance"
          unit="m"
          error={errors.targetDistance?.message}
          {...register("targetDistance")}
        />
      </div>

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
