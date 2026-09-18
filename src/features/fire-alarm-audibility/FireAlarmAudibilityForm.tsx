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
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
      <RadioGroupField
        legend="Notification mode"
        hideLegend
        emphasizeOptions
        options={[
          { value: "PUBLIC", label: "Public Mode" },
          { value: "PRIVATE", label: "Private Mode" },
          { value: "SLEEPING", label: "Sleeping Area" },
        ]}
        hint="Public mode requires the greater of average ambient +15 dB or 60-second max ambient +5 dB. Private mode uses narrower +10 dB / +5 dB offsets (e.g. staff-alert-only zones). Sleeping areas require a 75 dBA absolute floor at the pillow, overridden upward if the relative rule would demand more."
        {...register("mode")}
      />

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

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
