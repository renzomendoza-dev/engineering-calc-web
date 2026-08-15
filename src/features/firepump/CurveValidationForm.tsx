"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { PumpCurvePointsInput } from "./PumpCurvePointsInput";
import {
  curveValidationSchema,
  type CurveValidationFormInput,
  type CurveValidationFormValues,
} from "./schema";
import type { FirePumpCurveValidationRequest, FirePumpCurveValidationResponse } from "./types";

interface CurveValidationFormProps {
  onResult: (result: FirePumpCurveValidationResponse, candidateRatedPressurePsi: number) => void;
  /** Pre-fill from Page 1's "Use this in Curve Validation" link, e.g. ?demandFlow=550&demandPressure=80. */
  initialDemandFlow?: string;
  initialDemandPressure?: string;
}

export function CurveValidationForm({
  onResult,
  initialDemandFlow,
  initialDemandPressure,
}: CurveValidationFormProps) {
  const defaultValues: CurveValidationFormInput = {
    candidateRatedFlowGpm: 0,
    candidateRatedPressurePsi: 0,
    curvePoints: [
      { flowGpm: 0, pressurePsi: 0 },
      { flowGpm: 0, pressurePsi: 0 },
    ],
    demandFlowGpm: initialDemandFlow ? Number(initialDemandFlow) : 0,
    demandPressurePsi: initialDemandPressure ? Number(initialDemandPressure) : 0,
  };

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CurveValidationFormInput, unknown, CurveValidationFormValues>({
    resolver: zodResolver(curveValidationSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const candidateRatedFlowGpm = Number(watch("candidateRatedFlowGpm")) || undefined;

  const onSubmit = async (values: CurveValidationFormValues) => {
    setGeneralError(null);

    const request: FirePumpCurveValidationRequest = {
      candidateRatedFlowGpm: values.candidateRatedFlowGpm,
      candidateRatedPressurePsi: values.candidateRatedPressurePsi,
      curvePoints: values.curvePoints,
      demandFlowGpm: values.demandFlowGpm,
      demandPressurePsi: values.demandPressurePsi,
    };

    try {
      const result = await apiPost<FirePumpCurveValidationRequest, FirePumpCurveValidationResponse>(
        "/api/mechanical/firepump/curve-validation",
        request,
      );
      onResult(result, values.candidateRatedPressurePsi);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Candidate Rated Flow (GPM)"
          hint="The candidate pump's nameplate rated flow — the 100% point on its performance curve."
          error={errors.candidateRatedFlowGpm?.message}
          {...register("candidateRatedFlowGpm")}
        />
        <NumberField
          label="Candidate Rated Pressure (psi)"
          hint="The candidate pump's nameplate rated pressure at its rated flow."
          error={errors.candidateRatedPressurePsi?.message}
          {...register("candidateRatedPressurePsi")}
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Enter points straight from the pump manufacturer&apos;s published performance curve
        (flow vs. pressure). You need at least the shutoff point (0 GPM) and a point at or
        beyond 150% of the candidate&apos;s rated flow.
      </p>
      <PumpCurvePointsInput
        control={control}
        register={register}
        watch={watch}
        errors={errors}
        name="curvePoints"
        candidateRatedFlowGpm={candidateRatedFlowGpm}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Demand Flow (GPM)"
          hint="The flow your system requires — usually the rated flow from the Demand calculator."
          error={errors.demandFlowGpm?.message}
          {...register("demandFlowGpm")}
        />
        <NumberField
          label="Demand Pressure (psi)"
          hint="The pressure your system requires — usually the rated pressure from the Demand calculator."
          error={errors.demandPressurePsi?.message}
          {...register("demandPressurePsi")}
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
        {isSubmitting ? "Validating…" : "Validate"}
      </button>
    </form>
  );
}
