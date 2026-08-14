"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost, ApiError } from "@/lib/api-client";
import { PumpCurvePointsInput } from "./PumpCurvePointsInput";
import { powerSchema, type PowerFormInput, type PowerFormValues } from "./schema";
import type { FirePumpPowerRequest, FirePumpPowerResponse } from "./types";

const EMPTY_CURVE_POINTS = [
  { flowGpm: 0, pressurePsi: 0 },
  { flowGpm: 0, pressurePsi: 0 },
];

const defaultValues: PowerFormInput = {
  inputType: "RATED_POINT_ONLY",
  flowGpm: 0,
  pressurePsi: 0,
  curveRatedFlowGpm: undefined,
  curveRatedPressurePsi: undefined,
  curvePoints: undefined,
  pumpEfficiencyPercent: 75,
  specificGravity: 1,
};

interface PowerFormProps {
  onResult: (result: FirePumpPowerResponse) => void;
}

export function PowerForm({ onResult }: PowerFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PowerFormInput, unknown, PowerFormValues>({
    resolver: zodResolver(powerSchema),
    defaultValues,
  });

  const inputType = watch("inputType");
  const curveRatedFlowGpm = Number(watch("curveRatedFlowGpm")) || undefined;

  // Clear the other mode's fields when the input type toggles, so unmounted/invalid leftover
  // data (e.g. curvePoints' unrendered-and-thus-invisible validation errors) can never block
  // submission -- same reasoning as voltage drop's and demand's mode-toggle effects.
  useEffect(() => {
    if (inputType === "RATED_POINT_ONLY") {
      setValue("curveRatedFlowGpm", undefined);
      setValue("curveRatedPressurePsi", undefined);
      setValue("curvePoints", undefined);
    } else {
      setValue("flowGpm", undefined);
      setValue("pressurePsi", undefined);
      setValue("curvePoints", EMPTY_CURVE_POINTS);
    }
  }, [inputType, setValue]);

  const onSubmit = async (values: PowerFormValues) => {
    setGeneralError(null);

    const isRatedOnly = values.inputType === "RATED_POINT_ONLY";
    const request: FirePumpPowerRequest = {
      inputType: values.inputType,
      flowGpm: isRatedOnly ? (values.flowGpm ?? null) : null,
      pressurePsi: isRatedOnly ? (values.pressurePsi ?? null) : null,
      curveRatedFlowGpm: isRatedOnly ? null : (values.curveRatedFlowGpm ?? null),
      curveRatedPressurePsi: isRatedOnly ? null : (values.curveRatedPressurePsi ?? null),
      curvePoints: isRatedOnly ? null : (values.curvePoints ?? null),
      // API expects a fraction in (0, 1]; the form collects a 0-100 percentage.
      pumpEfficiency: values.pumpEfficiencyPercent / 100,
      specificGravity: values.specificGravity ?? null,
    };

    try {
      const result = await apiPost<FirePumpPowerRequest, FirePumpPowerResponse>(
        "/api/mechanical/firepump/power",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const unmatched: string[] = [];
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field in defaultValues) {
              setError(field as keyof PowerFormInput, { message });
            } else {
              unmatched.push(message);
            }
          }
        }
        setGeneralError(unmatched.length > 0 ? unmatched.join(" ") : err.message);
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="RATED_POINT_ONLY" className="h-4 w-4" {...register("inputType")} />
          Rated point only
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="FULL_CURVE" className="h-4 w-4" {...register("inputType")} />
          Full curve
        </label>
      </div>

      {inputType === "RATED_POINT_ONLY" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Flow (GPM)" error={errors.flowGpm?.message} {...register("flowGpm")} />
          <NumberField label="Pressure (psi)" error={errors.pressurePsi?.message} {...register("pressurePsi")} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Rated Flow (GPM)"
              error={errors.curveRatedFlowGpm?.message}
              {...register("curveRatedFlowGpm")}
            />
            <NumberField
              label="Rated Pressure (psi)"
              error={errors.curveRatedPressurePsi?.message}
              {...register("curveRatedPressurePsi")}
            />
          </div>
          <PumpCurvePointsInput
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            name="curvePoints"
            candidateRatedFlowGpm={curveRatedFlowGpm}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Pump Efficiency (%)"
          error={errors.pumpEfficiencyPercent?.message}
          {...register("pumpEfficiencyPercent")}
        />
        <NumberField
          label="Specific Gravity"
          error={errors.specificGravity?.message}
          {...register("specificGravity")}
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
