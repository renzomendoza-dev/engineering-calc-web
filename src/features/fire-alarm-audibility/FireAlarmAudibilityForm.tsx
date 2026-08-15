"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import {
  fireAlarmAudibilitySchema,
  type FireAlarmAudibilityFormInput,
  type FireAlarmAudibilityFormValues,
} from "./schema";
import type {
  FireAlarmAudibilityRequest,
  FireAlarmAudibilityResponse,
  FireAlarmNotificationMode,
} from "./types";

const defaultValues: FireAlarmAudibilityFormInput = {
  mode: "PUBLIC",
  applianceSplAtReferenceDb: 0,
  referenceDistanceMeters: 0,
  targetDistanceMeters: 0,
  measuredAverageAmbientDb: 0,
  measuredMaxSustainedAmbientDb: undefined,
};

interface FireAlarmAudibilityFormProps {
  onResult: (result: FireAlarmAudibilityResponse, request: FireAlarmAudibilityRequest) => void;
  onModeChange: (mode: FireAlarmNotificationMode) => void;
}

export function FireAlarmAudibilityForm({ onResult, onModeChange }: FireAlarmAudibilityFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FireAlarmAudibilityFormInput, unknown, FireAlarmAudibilityFormValues>({
    resolver: zodResolver(fireAlarmAudibilitySchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const mode = watch("mode");

  // Reports the selected mode up to the calculator so the formula-reference block can swap
  // to the formula for the mode currently selected in this form.
  useEffect(() => {
    onModeChange(mode);
  }, [mode, onModeChange]);

  const onSubmit = async (values: FireAlarmAudibilityFormValues) => {
    setGeneralError(null);

    const request: FireAlarmAudibilityRequest = {
      mode: values.mode,
      applianceSplAtReferenceDb: values.applianceSplAtReferenceDb,
      referenceDistanceMeters: values.referenceDistanceMeters,
      targetDistanceMeters: values.targetDistanceMeters,
      measuredAverageAmbientDb: values.measuredAverageAmbientDb,
      measuredMaxSustainedAmbientDb: values.measuredMaxSustainedAmbientDb ?? null,
    };

    try {
      const result = await apiPost<FireAlarmAudibilityRequest, FireAlarmAudibilityResponse>(
        "/api/acoustics/fire-alarm-audibility",
        request,
      );
      onResult(result, request);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="PUBLIC" className="h-4 w-4" {...register("mode")} />
            Public Mode
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="PRIVATE" className="h-4 w-4" {...register("mode")} />
            Private Mode
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="SLEEPING" className="h-4 w-4" {...register("mode")} />
            Sleeping Area
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Public mode requires the greater of average ambient +15 dB or 60-second max ambient
          +5 dB. Private mode uses narrower +10 dB / +5 dB offsets (e.g. staff-alert-only
          zones). Sleeping areas require a 75 dBA absolute floor at the pillow, overridden
          upward if the relative rule would demand more.
        </p>
      </div>

      <NumberField
        label="Appliance SPL at Reference Distance"
        unit="dB"
        error={errors.applianceSplAtReferenceDb?.message}
        {...register("applianceSplAtReferenceDb")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Reference Distance"
          unit="m"
          error={errors.referenceDistanceMeters?.message}
          {...register("referenceDistanceMeters")}
        />
        <NumberField
          label="Target Distance"
          unit="m"
          error={errors.targetDistanceMeters?.message}
          {...register("targetDistanceMeters")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Measured Average Ambient"
          unit="dB"
          error={errors.measuredAverageAmbientDb?.message}
          {...register("measuredAverageAmbientDb")}
        />
        <NumberField
          label="Measured Max Sustained Ambient"
          unit="dB"
          hint="Optional — leave blank if unmeasured. 60-second maximum sustained ambient level."
          error={errors.measuredMaxSustainedAmbientDb?.message}
          {...register("measuredMaxSustainedAmbientDb")}
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
