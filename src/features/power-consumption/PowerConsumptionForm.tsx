"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { CIRCUIT_TYPES, type CircuitType } from "@/features/voltage-drop/types";
import {
  powerConsumptionSchema,
  type PowerConsumptionFormInput,
  type PowerConsumptionFormValues,
} from "./schema";
import type { PowerConsumptionRequest, PowerConsumptionResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const CIRCUIT_TYPE_LABELS: Record<CircuitType, string> = {
  DC: "DC",
  SINGLE_PHASE_AC: "Single-Phase AC",
  THREE_PHASE_AC: "Three-Phase AC",
};

const circuitTypeOptions: SelectOption[] = [
  { value: "", label: "Select a circuit type" },
  ...CIRCUIT_TYPES.map((value) => ({ value, label: CIRCUIT_TYPE_LABELS[value] })),
];

const defaultValues: PowerConsumptionFormInput = {
  mode: "DIRECT_WATTAGE",
  wattageInput: 0,
  circuitType: "",
  voltage: 0,
  currentAmps: 0,
  powerFactor: undefined,
  horsepowerInput: 0,
  motorEfficiencyPercent: undefined,
  runtimeEntryMode: "simple",
  totalOperatingHours: 0,
  hoursPerDay: 0,
  numberOfDays: 0,
  pricePerKwh: undefined,
};

interface PowerConsumptionFormProps {
  onResult: (result: PowerConsumptionResponse) => void;
}

export function PowerConsumptionForm({ onResult }: PowerConsumptionFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PowerConsumptionFormInput, unknown, PowerConsumptionFormValues>({
    resolver: zodResolver(powerConsumptionSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const mode = watch("mode");
  const circuitType = watch("circuitType");
  const runtimeEntryMode = watch("runtimeEntryMode");
  const hoursPerDay = watch("hoursPerDay");
  const numberOfDays = watch("numberOfDays");
  const totalOperatingHours = watch("totalOperatingHours");
  const isDc = circuitType === "DC";

  // Clear the other two modes' fields whenever mode changes, so a stale value from a
  // previously-selected mode is never silently submitted -- mirrors VoltageDropForm's
  // useCustomImpedance reset-on-toggle effect. calc-core requires these fields to be null
  // outside their own mode, not just ignored, so this isn't only a UX nicety.
  useEffect(() => {
    if (mode !== "DIRECT_WATTAGE") {
      setValue("wattageInput", undefined);
    }
    if (mode !== "VOLTAGE_CURRENT") {
      setValue("circuitType", "");
      setValue("voltage", undefined);
      setValue("currentAmps", undefined);
      setValue("powerFactor", undefined);
    }
    if (mode !== "HORSEPOWER") {
      setValue("horsepowerInput", undefined);
      setValue("motorEfficiencyPercent", undefined);
    }
  }, [mode, setValue]);

  // Power factor has no meaning for DC -- clear it, don't just hide it, so a value entered
  // before switching to DC can't leak into the request (calc-core requires powerFactor to be
  // null for DC circuits).
  useEffect(() => {
    if (isDc) {
      setValue("powerFactor", undefined);
    }
  }, [isDc, setValue]);

  // Keep totalOperatingHours authoritative for the current runtime-entry mode: recomputed
  // from hoursPerDay * numberOfDays while "helper" is active, reset to 0 otherwise (so
  // switching away from "helper" never leaves a stale computed value, and switching into it
  // never leaves a stale manually-typed one).
  useEffect(() => {
    if (runtimeEntryMode === "helper") {
      const hours = Number(hoursPerDay);
      const days = Number(numberOfDays);
      const total = Number.isFinite(hours) && Number.isFinite(days) ? hours * days : 0;
      setValue("totalOperatingHours", total);
    } else {
      setValue("totalOperatingHours", 0);
    }
  }, [runtimeEntryMode, hoursPerDay, numberOfDays, setValue]);

  const onSubmit = async (values: PowerConsumptionFormValues) => {
    setGeneralError(null);

    const request: PowerConsumptionRequest = {
      mode: values.mode,
      wattageInput: values.mode === "DIRECT_WATTAGE" ? (values.wattageInput ?? null) : null,
      circuitType: values.mode === "VOLTAGE_CURRENT" ? (values.circuitType || null) : null,
      voltage: values.mode === "VOLTAGE_CURRENT" ? (values.voltage ?? null) : null,
      currentAmps: values.mode === "VOLTAGE_CURRENT" ? (values.currentAmps ?? null) : null,
      powerFactor:
        values.mode === "VOLTAGE_CURRENT" && values.circuitType !== "DC" ? (values.powerFactor ?? null) : null,
      horsepowerInput: values.mode === "HORSEPOWER" ? (values.horsepowerInput ?? null) : null,
      motorEfficiencyPercent: values.mode === "HORSEPOWER" ? (values.motorEfficiencyPercent ?? null) : null,
      totalOperatingHours: values.totalOperatingHours,
      pricePerKwh: values.pricePerKwh ?? null,
    };

    try {
      const result = await apiPost<PowerConsumptionRequest, PowerConsumptionResponse>(
        "/api/electrical/power-consumption",
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
        legend="Input Mode"
        options={[
          { value: "DIRECT_WATTAGE", label: "Direct Wattage" },
          { value: "VOLTAGE_CURRENT", label: "Voltage & Current" },
          { value: "HORSEPOWER", label: "Horsepower" },
        ]}
        {...register("mode")}
      />

      {mode === "DIRECT_WATTAGE" && (
        <NumberField
          label="Wattage"
          unit="W"
          error={errors.wattageInput?.message}
          {...register("wattageInput")}
        />
      )}

      {mode === "VOLTAGE_CURRENT" && (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Circuit Type"
            options={circuitTypeOptions}
            error={errors.circuitType?.message}
            {...register("circuitType")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Voltage" unit="V" error={errors.voltage?.message} {...register("voltage")} />
            <NumberField
              label="Current"
              unit="A"
              error={errors.currentAmps?.message}
              {...register("currentAmps")}
            />
          </div>
          {!isDc && (
            <NumberField
              label="Power Factor"
              hint="Defaults to 1.0 if left blank."
              error={errors.powerFactor?.message}
              {...register("powerFactor")}
            />
          )}
        </div>
      )}

      {mode === "HORSEPOWER" && (
        <div className="flex flex-col gap-4">
          <NumberField
            label="Horsepower"
            unit="HP"
            error={errors.horsepowerInput?.message}
            {...register("horsepowerInput")}
          />
          <NumberField
            label="Motor Efficiency"
            unit="%"
            hint="Defaults to 85% if left blank — a typical estimate; enter the actual value from the motor's nameplate or datasheet if known for a more accurate result."
            error={errors.motorEfficiencyPercent?.message}
            {...register("motorEfficiencyPercent")}
          />
        </div>
      )}

      <RadioGroupField
        legend="Operating Runtime"
        options={[
          { value: "simple", label: "Enter total hours directly" },
          { value: "helper", label: "Calculate from hours/day" },
        ]}
        {...register("runtimeEntryMode")}
      />

      {runtimeEntryMode === "simple" ? (
        <NumberField
          label="Total Operating Hours"
          unit="h"
          error={errors.totalOperatingHours?.message}
          {...register("totalOperatingHours")}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Hours Per Day"
              unit="h"
              error={errors.hoursPerDay?.message}
              {...register("hoursPerDay")}
            />
            <NumberField
              label="Number of Days"
              error={errors.numberOfDays?.message}
              {...register("numberOfDays")}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {/* Rounded for display only (0.1 × 3 is 0.30000000000000004 in floating point);
                the unrounded product is what gets submitted. */}
            = {Number((Number(totalOperatingHours) || 0).toFixed(4))} total hours
          </p>
        </div>
      )}

      <NumberField
        label="Price per kWh"
        hint="Leave blank to skip cost estimate."
        error={errors.pricePerKwh?.message}
        {...register("pricePerKwh")}
      />

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
