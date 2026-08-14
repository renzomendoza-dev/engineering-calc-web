"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost, ApiError } from "@/lib/api-client";
import { usePipeMaterials } from "@/hooks/usePipeMaterials";
import {
  checkVelocitySchema,
  FLOW_RATE_UNITS,
  RAW_DIAMETER_UNITS,
  type CheckVelocityFormInput,
  type CheckVelocityFormValues,
} from "./schema";
import type { PipeVelocityRequest, PipeVelocityResponse } from "./types";

const flowRateUnitOptions: SelectOption[] = FLOW_RATE_UNITS.map((value) => ({ value, label: value }));
const rawDiameterUnitOptions: SelectOption[] = RAW_DIAMETER_UNITS.map((value) => ({ value, label: value }));

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

  const { materials, isLoading: referenceLoading, error: referenceError } = usePipeMaterials();

  const diameterSource = watch("diameterSource");
  const nominalMaterial = watch("nominalMaterial");
  const nominalSchedule = watch("nominalSchedule");

  const selectedMaterial = materials.find((m) => m.material === nominalMaterial);
  const scheduleOptions = useMemo(() => selectedMaterial?.schedules ?? [], [selectedMaterial]);
  const selectedSchedule = scheduleOptions.find((s) => s.schedule === nominalSchedule);
  const sizeOptions = selectedSchedule?.sizes ?? [];

  // Most materials (GI/BI/uPVC) publish a single schedule -- auto-select it rather than
  // making the user pick from a one-item dropdown. PPR (multiple schedules) still requires
  // an explicit choice.
  useEffect(() => {
    if (scheduleOptions.length === 1 && nominalSchedule !== scheduleOptions[0].schedule) {
      setValue("nominalSchedule", scheduleOptions[0].schedule);
    }
  }, [scheduleOptions, nominalSchedule, setValue]);

  // Changing material invalidates whatever size was selected under the previous material.
  useEffect(() => {
    setValue("nominalSize", "");
  }, [nominalMaterial, setValue]);

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const materialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...materials.map((m) => ({ value: m.material, label: m.materialName })),
  ];
  const scheduleSelectOptions: SelectOption[] = [
    { value: "", label: "Select a schedule" },
    ...scheduleOptions.map((s) => ({ value: s.schedule, label: s.schedule })),
  ];
  const sizeSelectOptions: SelectOption[] = [
    { value: "", label: "Select a size" },
    ...sizeOptions.map((s) => ({ value: s.nominalSize, label: s.nominalLabel })),
  ];

  const showPlaceholderNotice = selectedMaterial?.confidence === "placeholder";

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

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="standard" className="h-4 w-4" {...register("diameterSource")} />
          Standard pipe size
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="radio" value="custom" className="h-4 w-4" {...register("diameterSource")} />
          Custom diameter
        </label>
      </div>

      {diameterSource === "standard" ? (
        <div className="flex flex-col gap-4">
          {referenceError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Couldn&apos;t load pipe reference data ({referenceError}).
            </div>
          )}
          <SelectField
            label="Material"
            options={materialOptions}
            disabled={referenceFieldsDisabled}
            error={errors.nominalMaterial?.message}
            {...register("nominalMaterial")}
          />
          {showPlaceholderNotice && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Using generic reference data — verify for critical designs.
            </p>
          )}
          {scheduleOptions.length > 1 && (
            <SelectField label="Schedule" options={scheduleSelectOptions} {...register("nominalSchedule")} />
          )}
          <SelectField
            label="Nominal Size"
            options={sizeSelectOptions}
            disabled={referenceFieldsDisabled || !nominalMaterial || !nominalSchedule}
            error={errors.nominalSize?.message}
            {...register("nominalSize")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Diameter"
            error={errors.rawDiameterValue?.message}
            {...register("rawDiameterValue")}
          />
          <SelectField
            label="Unit"
            options={rawDiameterUnitOptions}
            error={errors.rawDiameterUnit?.message}
            {...register("rawDiameterUnit")}
          />
        </div>
      )}

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
