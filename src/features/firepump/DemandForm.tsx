"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost, ApiError } from "@/lib/api-client";
import { demandSchema, type DemandFormInput, type DemandFormValues } from "./schema";
import { SUCTION_CONDITIONS, type FirePumpDemandRequest, type FirePumpDemandResponse } from "./types";

const SUCTION_LABELS: Record<(typeof SUCTION_CONDITIONS)[number], string> = {
  FLOODED: "Flooded",
  LIFT: "Lift",
};

const suctionOptions: SelectOption[] = SUCTION_CONDITIONS.map((value) => ({
  value,
  label: SUCTION_LABELS[value],
}));

const defaultValues: DemandFormInput = {
  requiredFlowGpm: 0,
  requiredPressurePsiAtDemandPoint: 0,
  suctionCondition: "FLOODED",
  availableSuctionPressurePsi: undefined,
  suctionLiftFeet: undefined,
  safetyMarginPercent: 0,
};

interface DemandFormProps {
  onResult: (result: FirePumpDemandResponse) => void;
}

export function DemandForm({ onResult }: DemandFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemandFormInput, unknown, DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues,
  });

  const suctionCondition = watch("suctionCondition");

  // Clear the other suction mode's field when toggling, so a stale value from the previously-
  // visible field never gets silently submitted -- same reasoning as voltage drop's schema.
  useEffect(() => {
    if (suctionCondition === "FLOODED") {
      setValue("suctionLiftFeet", undefined);
    } else {
      setValue("availableSuctionPressurePsi", undefined);
    }
  }, [suctionCondition, setValue]);

  const onSubmit = async (values: DemandFormValues) => {
    setGeneralError(null);

    const request: FirePumpDemandRequest = {
      requiredFlowGpm: values.requiredFlowGpm,
      requiredPressurePsiAtDemandPoint: values.requiredPressurePsiAtDemandPoint,
      suctionCondition: values.suctionCondition,
      availableSuctionPressurePsi:
        values.suctionCondition === "FLOODED" ? (values.availableSuctionPressurePsi ?? null) : null,
      suctionLiftFeet: values.suctionCondition === "LIFT" ? (values.suctionLiftFeet ?? null) : null,
      safetyMarginPercent: values.safetyMarginPercent ?? 0,
    };

    try {
      const result = await apiPost<FirePumpDemandRequest, FirePumpDemandResponse>(
        "/api/mechanical/firepump/demand",
        request,
      );
      onResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const unmatched: string[] = [];
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field in defaultValues) {
              setError(field as keyof DemandFormInput, { message });
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
        <NumberField
          label="Required Flow (GPM)"
          error={errors.requiredFlowGpm?.message}
          {...register("requiredFlowGpm")}
        />
        <NumberField
          label="Required Pressure at Demand Point (psi)"
          error={errors.requiredPressurePsiAtDemandPoint?.message}
          {...register("requiredPressurePsiAtDemandPoint")}
        />
      </div>

      <SelectField
        label="Suction Condition"
        options={suctionOptions}
        error={errors.suctionCondition?.message}
        {...register("suctionCondition")}
      />

      {suctionCondition === "FLOODED" ? (
        <NumberField
          label="Available Suction Pressure (psi)"
          error={errors.availableSuctionPressurePsi?.message}
          {...register("availableSuctionPressurePsi")}
        />
      ) : (
        <NumberField
          label="Suction Lift (feet)"
          error={errors.suctionLiftFeet?.message}
          {...register("suctionLiftFeet")}
        />
      )}

      <NumberField
        label="Safety Margin (%)"
        error={errors.safetyMarginPercent?.message}
        {...register("safetyMarginPercent")}
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
        {isSubmitting ? "Calculating…" : "Calculate"}
      </button>
    </form>
  );
}
