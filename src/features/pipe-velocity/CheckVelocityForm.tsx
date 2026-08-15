"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { DiameterSpecInput } from "@/components/DiameterSpecInput";
import { apiPost, ApiError } from "@/lib/api-client";
import {
  checkVelocitySchema,
  FLOW_RATE_UNITS,
  type CheckVelocityFormInput,
  type CheckVelocityFormValues,
} from "./schema";
import type { PipeVelocityRequest, PipeVelocityResponse } from "./types";

const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));

const defaultValues: CheckVelocityFormInput = {
  flowRateValue: 0,
  flowRateUnit: "gpm",
  diameterSource: "standard",
  nominalMaterial: "",
  nominalSchedule: "",
  nominalSize: "",
  rawDiameterValue: undefined,
  rawDiameterUnit: "mm",
};

interface CheckVelocityFormProps {
  onResult: (result: PipeVelocityResponse) => void;
}

export function CheckVelocityForm({ onResult }: CheckVelocityFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckVelocityFormInput, unknown, CheckVelocityFormValues>({
    resolver: zodResolver(checkVelocitySchema),
    defaultValues,
  });

  const onSubmit = async (values: CheckVelocityFormValues) => {
    setGeneralError(null);

    const request: PipeVelocityRequest = {
      mode: "VELOCITY_FROM_DIAMETER",
      flowRateValue: values.flowRateValue,
      flowRateUnit: values.flowRateUnit,
      diameterSpecType: values.diameterSource === "standard" ? "NOMINAL" : "RAW",
      nominalMaterial: values.diameterSource === "standard" ? values.nominalMaterial || null : null,
      nominalSchedule: values.diameterSource === "standard" ? values.nominalSchedule || null : null,
      // The backend field is named nominalLabel, but it takes the machine-friendly
      // nominalSize key (e.g. "2"), not the reference data's human-readable nominalLabel --
      // see PipeVelocityRequest / NominalSize's Javadoc in calc-core.
      nominalLabel: values.diameterSource === "standard" ? values.nominalSize || null : null,
      rawDiameterValue: values.diameterSource === "custom" ? (values.rawDiameterValue ?? null) : null,
      rawDiameterUnit: values.diameterSource === "custom" ? values.rawDiameterUnit || null : null,
      targetVelocityValue: null,
      targetVelocityUnit: null,
      pipeMaterial: null,
      schedule: null,
    };

    try {
      const result = await apiPost<PipeVelocityRequest, PipeVelocityResponse>(
        "/api/mechanical/pipe-velocity",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const unmatched: string[] = [];
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field in defaultValues) {
              setError(field as keyof CheckVelocityFormInput, { message });
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
        <NumberField label="Flow Rate" error={errors.flowRateValue?.message} {...register("flowRateValue")} />
        <SelectField
          label="Flow Rate Unit"
          options={flowRateUnitOptions}
          error={errors.flowRateUnit?.message}
          {...register("flowRateUnit")}
        />
      </div>

      <DiameterSpecInput register={register} watch={watch} setValue={setValue} errors={errors} />

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
