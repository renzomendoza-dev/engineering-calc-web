"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { DiameterSpecInput } from "@/components/DiameterSpecInput";
import { apiPost, ApiError } from "@/lib/api-client";
import { pressureLossSchema, FLOW_RATE_UNITS, type PressureLossFormInput, type PressureLossFormValues } from "./schema";
import { FLUIDS, type PipePressureLossRequest, type PipePressureLossResponse } from "./types";

const fluidOptions: SelectOption[] = FLUIDS.map((f) => ({ value: f.key, label: f.label }));
const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

const defaultValues: PressureLossFormInput = {
  fluidKey: FLUIDS[0].key,
  fluidTemperatureCelsius: 20,
  flowRateValue: 0,
  flowRateUnit: "L/s",
  diameterSource: "standard",
  nominalMaterial: "",
  nominalSchedule: "",
  nominalSize: "",
  rawDiameterValue: undefined,
  rawDiameterUnit: "mm",
  pipeLengthMeters: 0,
  method: "SWAMEE_JAIN",
};

interface PressureLossFormProps {
  onResult: (result: PipePressureLossResponse) => void;
}

export function PressureLossForm({ onResult }: PressureLossFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PressureLossFormInput, unknown, PressureLossFormValues>({
    resolver: zodResolver(pressureLossSchema),
    defaultValues,
  });

  const onSubmit = async (values: PressureLossFormValues) => {
    setGeneralError(null);

    const request: PipePressureLossRequest = {
      fluidKey: values.fluidKey,
      fluidTemperatureCelsius: values.fluidTemperatureCelsius,
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      diameterSpecType: values.diameterSource === "standard" ? "NOMINAL" : "RAW",
      nominalMaterial: values.diameterSource === "standard" ? values.nominalMaterial || null : null,
      nominalSchedule: values.diameterSource === "standard" ? values.nominalSchedule || null : null,
      // The backend field is named nominalLabel, but it takes the machine-friendly
      // nominalSize key (e.g. "2"), not the reference data's human-readable nominalLabel --
      // see PipePressureLossRequest / NominalSize's Javadoc in calc-core.
      nominalLabel: values.diameterSource === "standard" ? values.nominalSize || null : null,
      rawDiameterValue: values.diameterSource === "custom" ? (values.rawDiameterValue ?? null) : null,
      rawDiameterUnit: values.diameterSource === "custom" ? values.rawDiameterUnit || null : null,
      pipeLengthMeters: values.pipeLengthMeters,
      method: values.method,
    };

    try {
      const result = await apiPost<PipePressureLossRequest, PipePressureLossResponse>(
        "/api/mechanical/pipe-pressure-loss",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const unmatched: string[] = [];
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field in defaultValues) {
              setError(field as keyof PressureLossFormInput, { message });
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Fluid"
          options={fluidOptions}
          error={errors.fluidKey?.message}
          {...register("fluidKey")}
        />
        <NumberField
          label="Fluid Temperature (°C)"
          hint="Reference data currently covers water from 0-100 °C."
          error={errors.fluidTemperatureCelsius?.message}
          {...register("fluidTemperatureCelsius")}
        />
      </div>

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

      <NumberField
        label="Pipe Length (m)"
        error={errors.pipeLengthMeters?.message}
        {...register("pipeLengthMeters")}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Friction Factor Method</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="SWAMEE_JAIN" className="h-4 w-4" {...register("method")} />
            Swamee-Jain (fast)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="radio" value="COLEBROOK_WHITE" className="h-4 w-4" {...register("method")} />
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
