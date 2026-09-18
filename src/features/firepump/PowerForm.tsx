"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { PumpCurvePointsInput } from "./PumpCurvePointsInput";
import { powerSchema, type PowerFormInput, type PowerFormValues } from "./schema";
import type { FirePumpPowerRequest, FirePumpPowerResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

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
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <RadioGroupField
        legend="Pump data to evaluate"
        hideLegend
        emphasizeOptions
        options={[
          { value: "RATED_POINT_ONLY", label: "Rated point only" },
          { value: "FULL_CURVE", label: "Full curve" },
        ]}
        hint="Rated point only evaluates power at a single operating point — quick, but doesn't check the overload (150% flow) point. Full curve evaluates both, giving a more reliable driver size."
        {...register("inputType")}
      />

      {inputType === "RATED_POINT_ONLY" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Flow (GPM)"
            hint="The operating point to evaluate power at — usually the pump's rated flow."
            error={errors.flowGpm?.message}
            {...register("flowGpm")}
          />
          <NumberField
            label="Pressure (psi)"
            hint="The pressure at that operating point — usually the pump's rated pressure."
            error={errors.pressurePsi?.message}
            {...register("pressurePsi")}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Rated Flow (GPM)"
              hint="The pump's nameplate rated flow — the 100% point on its performance curve."
              error={errors.curveRatedFlowGpm?.message}
              {...register("curveRatedFlowGpm")}
            />
            <NumberField
              label="Rated Pressure (psi)"
              hint="The pump's nameplate rated pressure at its rated flow."
              error={errors.curveRatedPressurePsi?.message}
              {...register("curveRatedPressurePsi")}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter points from the pump manufacturer&apos;s published performance curve. Power is
            evaluated at the rated point and at 150% of rated flow.
          </p>
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
          hint="The pump's efficiency at its rated point, from the manufacturer's curve or datasheet (typically 60-85%)."
          error={errors.pumpEfficiencyPercent?.message}
          {...register("pumpEfficiencyPercent")}
        />
        <NumberField
          label="Specific Gravity"
          hint="Ratio of the fluid's density to water. Leave at 1.0 for plain water."
          error={errors.specificGravity?.message}
          {...register("specificGravity")}
        />
      </div>

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
