"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useDuctRoughnessMaterials } from "@/hooks/useDuctRoughnessMaterials";
import { DuctVelocitySuggestionHelper } from "./DuctVelocitySuggestionHelper";
import { ductSizingSchema, type DuctSizingFormInput, type DuctSizingFormValues } from "./schema";
import {
  DUCT_MATERIALS_WITH_EXTRA_CAVEAT,
  type DuctShape,
  type DuctSizingMethod,
  type DuctSizingRequest,
  type DuctSizingResponse,
} from "./types";

const defaultValues: DuctSizingFormInput = {
  method: "EQUAL_FRICTION",
  airFlowLps: 0,
  airTemperatureCelsius: 20,
  altitudeMeters: 0,
  ductMaterial: "",
  frictionMethod: "SWAMEE_JAIN",
  shape: "ROUND",
  // Height is the more common real-world constraint (ceiling void), so it's the default —
  // not an arbitrary alphabetical/enum-order choice.
  fixedDimensionType: "HEIGHT",
  fixedDimensionValueMm: undefined,
  targetFrictionRatePaPerM: 0,
  maxVelocityMps: undefined,
};

interface DuctSizingFormProps {
  onResult: (result: DuctSizingResponse) => void;
  onShapeChange: (shape: DuctShape) => void;
  onMethodChange: (method: DuctSizingMethod) => void;
}

export function DuctSizingForm({ onResult, onShapeChange, onMethodChange }: DuctSizingFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DuctSizingFormInput, unknown, DuctSizingFormValues>({
    resolver: zodResolver(ductSizingSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const { materials, isLoading: materialsLoading, error: materialsError } = useDuctRoughnessMaterials();

  const shape = watch("shape");
  const method = watch("method");
  const ductMaterial = watch("ductMaterial");
  const isRectangular = shape === "RECTANGULAR";
  const isVelocity = method === "VELOCITY";

  useEffect(() => onShapeChange(shape), [shape, onShapeChange]);
  useEffect(() => onMethodChange(method), [method, onMethodChange]);

  const selectedMaterialHasExtraCaveat = (
    DUCT_MATERIALS_WITH_EXTRA_CAVEAT as readonly string[]
  ).includes(ductMaterial);
  const selectedMaterialCaveatNote = materials.find((m) => m.material === ductMaterial)?.sourceNote;

  const materialOptions: SelectOption[] = [
    { value: "", label: materialsLoading ? "Loading…" : "Select a duct material" },
    ...materials.map((m) => ({ value: m.material, label: m.label })),
  ];

  const onSubmit = async (values: DuctSizingFormValues) => {
    setGeneralError(null);

    const request: DuctSizingRequest = {
      method: values.method,
      airFlowLps: values.airFlowLps,
      airTemperatureCelsius: values.airTemperatureCelsius,
      altitudeMeters: values.altitudeMeters,
      ductMaterial: values.ductMaterial,
      frictionMethod: values.frictionMethod,
      shape: values.shape,
      fixedDimensionType: values.shape === "RECTANGULAR" ? (values.fixedDimensionType ?? "HEIGHT") : null,
      fixedDimensionValueMm: values.shape === "RECTANGULAR" ? (values.fixedDimensionValueMm ?? null) : null,
      targetFrictionRatePaPerM:
        values.method === "EQUAL_FRICTION" ? (values.targetFrictionRatePaPerM ?? null) : null,
      maxVelocityMps: values.method === "VELOCITY" ? (values.maxVelocityMps ?? null) : null,
    };

    try {
      const result = await apiPost<DuctSizingRequest, DuctSizingResponse>(
        "/api/mechanical/duct/sizing",
        request,
      );
      onResult(result);
    } catch (err) {
      // A non-convergent solve (e.g. an unreasonable target friction rate or fixed dimension
      // with no valid solution) surfaces via calc-core's CalculationException, whose message
      // states what to try instead -- shown as-is by handleApiError's generalError banner.
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Airflow &amp; Conditions
        </h3>

        <NumberField
          label="Airflow"
          unit="L/s"
          error={errors.airFlowLps?.message}
          {...register("airFlowLps")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Air Temperature"
            unit="°C"
            error={errors.airTemperatureCelsius?.message}
            {...register("airTemperatureCelsius")}
          />
          <NumberField
            label="Altitude"
            unit="m"
            hint="Affects air density via standard atmosphere correction."
            error={errors.altitudeMeters?.message}
            {...register("altitudeMeters")}
          />
        </div>

        {materialsError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Couldn&apos;t load duct material data ({materialsError}).
          </div>
        )}
        <SelectField
          label="Duct Material"
          options={materialOptions}
          disabled={materialsLoading || !!materialsError}
          error={errors.ductMaterial?.message}
          {...register("ductMaterial")}
        />
        {selectedMaterialHasExtraCaveat && selectedMaterialCaveatNote && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {selectedMaterialCaveatNote}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Friction Factor Method</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="radio" value="SWAMEE_JAIN" className="h-4 w-4" {...register("frictionMethod")} />
              Swamee-Jain (fast)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="radio" value="COLEBROOK_WHITE" className="h-4 w-4" {...register("frictionMethod")} />
              Colebrook-White (more precise)
            </label>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Colebrook-White solves the implicit friction-factor equation by iterating to a
            converged answer — more exact, but takes marginally longer. Swamee-Jain is a direct
            (non-iterative) approximation of Colebrook-White, accurate to within about 1% for
            typical turbulent flow.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Duct Shape</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="ROUND" className="h-4 w-4" {...register("shape")} />
            Round
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="RECTANGULAR" className="h-4 w-4" {...register("shape")} />
            Rectangular
          </label>
        </div>

        {isRectangular && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Duct dimensions shown in mm, following HVAC industry convention.
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fixed Dimension</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="radio"
                    value="WIDTH"
                    className="h-4 w-4"
                    {...register("fixedDimensionType")}
                  />
                  Width
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="radio"
                    value="HEIGHT"
                    className="h-4 w-4"
                    {...register("fixedDimensionType")}
                  />
                  Height
                </label>
              </div>
            </div>
            <NumberField
              label={watch("fixedDimensionType") === "WIDTH" ? "Duct Width" : "Duct Height"}
              unit="mm"
              error={errors.fixedDimensionValueMm?.message}
              {...register("fixedDimensionValueMm")}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sizing Method</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="EQUAL_FRICTION" className="h-4 w-4" {...register("method")} />
            Equal Friction
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="VELOCITY" className="h-4 w-4" {...register("method")} />
            Velocity
          </label>
        </div>

        {isVelocity ? (
          <div className="flex flex-col gap-3">
            <NumberField
              label="Max Velocity"
              unit="m/s"
              error={errors.maxVelocityMps?.message}
              {...register("maxVelocityMps")}
            />
            <DuctVelocitySuggestionHelper
              shape={shape}
              onSuggest={(value) => setValue("maxVelocityMps", value)}
            />
          </div>
        ) : (
          <NumberField
            label="Target Friction Rate"
            unit="Pa/m"
            error={errors.targetFrictionRatePaPerM?.message}
            {...register("targetFrictionRatePaPerM")}
          />
        )}
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
