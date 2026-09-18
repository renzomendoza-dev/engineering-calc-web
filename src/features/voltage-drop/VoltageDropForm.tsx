"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useConductorReferenceData } from "@/hooks/useConductorReferenceData";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";
import { voltageDropSchema, type VoltageDropFormInput, type VoltageDropFormValues } from "./schema";
import { CIRCUIT_TYPES, type VoltageDropRequest, type VoltageDropResponse } from "./types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";

const CIRCUIT_TYPE_LABELS: Record<VoltageDropFormInput["circuitType"], string> = {
  DC: "DC",
  SINGLE_PHASE_AC: "Single-Phase AC",
  THREE_PHASE_AC: "Three-Phase AC",
};

const circuitTypeOptions: SelectOption[] = CIRCUIT_TYPES.map((value) => ({
  value,
  label: CIRCUIT_TYPE_LABELS[value],
}));

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const defaultValues: VoltageDropFormInput = {
  circuitType: "THREE_PHASE_AC",
  currentAmps: 0,
  oneWayLengthMeters: 0,
  powerFactor: 1,
  systemVoltage: 0,
  parallelSetsPerPhase: 1,
  useCustomImpedance: false,
  conductorSizeLabel: "",
  conductorMaterial: "",
  conduitMaterial: "",
  customResistanceOhmsPerMeter: undefined,
  customReactanceOhmsPerMeter: undefined,
};

interface VoltageDropFormProps {
  onResult: (result: VoltageDropResponse) => void;
}

export function VoltageDropForm({ onResult }: VoltageDropFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VoltageDropFormInput, unknown, VoltageDropFormValues>({
    resolver: zodResolver(voltageDropSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const {
    conductorSizes,
    conductorMaterials,
    conduitMaterials,
    isLoading: referenceLoading,
    error: referenceError,
  } = useConductorReferenceData();

  const circuitType = watch("circuitType");
  const useCustomImpedance = watch("useCustomImpedance");
  const isDc = circuitType === "DC";

  // Clear the other mode's fields when the impedance mode toggles, so a stale value from
  // the previously-visible fields never gets silently submitted.
  useEffect(() => {
    if (useCustomImpedance) {
      setValue("conductorSizeLabel", "");
      setValue("conductorMaterial", "");
      setValue("conduitMaterial", "");
    } else {
      setValue("customResistanceOhmsPerMeter", undefined);
      setValue("customReactanceOhmsPerMeter", undefined);
    }
  }, [useCustomImpedance, setValue]);

  // conduitMaterial and reactance aren't meaningful for DC — clear them (rather than just
  // hiding the inputs) so a value entered before switching to DC can't leak into the
  // request; reactance is forced to 0, mirroring calc-core's VoltageDropInput rule.
  useEffect(() => {
    if (isDc) {
      setValue("conduitMaterial", "");
      setValue("customReactanceOhmsPerMeter", 0);
    }
  }, [isDc, setValue]);

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const conductorSizeOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a size" },
    ...conductorSizes.map((size) => ({
      value: size.label,
      label: `${size.label} (${size.crossSectionMm2} mm²)`,
    })),
  ];
  const conductorMaterialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...conductorMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];
  const conduitMaterialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...conduitMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];

  const onSubmit = async (values: VoltageDropFormValues) => {
    setGeneralError(null);

    const request: VoltageDropRequest = {
      circuitType: values.circuitType,
      currentAmps: values.currentAmps,
      oneWayLengthMeters: values.oneWayLengthMeters,
      powerFactor: isDc ? 0 : (values.powerFactor ?? 1),
      systemVoltage: values.systemVoltage,
      parallelSetsPerPhase: values.parallelSetsPerPhase,
      useCustomImpedance: values.useCustomImpedance,
      conductorSizeLabel: values.useCustomImpedance ? null : (values.conductorSizeLabel || null),
      conductorMaterial: values.useCustomImpedance ? null : (values.conductorMaterial || null),
      conduitMaterial:
        values.useCustomImpedance || isDc ? null : (values.conduitMaterial || null),
      customResistanceOhmsPerMeter: values.useCustomImpedance
        ? (values.customResistanceOhmsPerMeter ?? null)
        : null,
      customReactanceOhmsPerMeter: values.useCustomImpedance
        ? isDc
          ? 0
          : (values.customReactanceOhmsPerMeter ?? null)
        : null,
    };

    try {
      const result = await apiPost<VoltageDropRequest, VoltageDropResponse>(
        "/api/electrical/voltage-drop",
        request,
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <SelectField
        label="Circuit Type"
        options={circuitTypeOptions}
        error={errors.circuitType?.message}
        {...register("circuitType")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Load Current"
          unit="A"
          error={errors.currentAmps?.message}
          {...register("currentAmps")}
        />
        <NumberField
          label="One-Way Length"
          unit="m"
          error={errors.oneWayLengthMeters?.message}
          {...register("oneWayLengthMeters")}
        />
        <NumberField
          label="Power Factor"
          disabled={isDc}
          error={errors.powerFactor?.message}
          {...register("powerFactor")}
        />
        <NumberField
          label="System Voltage"
          unit="V"
          error={errors.systemVoltage?.message}
          {...register("systemVoltage")}
        />
        <NumberField
          label="Parallel Sets per Phase"
          error={errors.parallelSetsPerPhase?.message}
          {...register("parallelSetsPerPhase")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          {...register("useCustomImpedance")}
        />
        Enter custom resistance/reactance instead of using PEC reference tables
      </label>

      {useCustomImpedance ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Custom Resistance"
            unit="Ω/m"
            error={errors.customResistanceOhmsPerMeter?.message}
            {...register("customResistanceOhmsPerMeter")}
          />
          {!isDc && (
            <NumberField
              label="Custom Reactance"
              unit="Ω/m"
              error={errors.customReactanceOhmsPerMeter?.message}
              {...register("customReactanceOhmsPerMeter")}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {referenceError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Couldn&apos;t load reference data ({referenceError}). Switch to custom values
              above instead.
            </div>
          )}
          <SelectField
            label="Conductor Size"
            options={conductorSizeOptions}
            disabled={referenceFieldsDisabled}
            error={errors.conductorSizeLabel?.message}
            {...register("conductorSizeLabel")}
          />
          <SelectField
            label="Conductor Material"
            options={conductorMaterialOptions}
            disabled={referenceFieldsDisabled}
            error={errors.conductorMaterial?.message}
            {...register("conductorMaterial")}
          />
          {!isDc && (
            <SelectField
              label="Conduit Material"
              options={conduitMaterialOptions}
              disabled={referenceFieldsDisabled}
              error={errors.conduitMaterial?.message}
              {...register("conduitMaterial")}
            />
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Source: {PEC_CITATION.bookTitle}, {PEC_CITATION.edition} — Table{" "}
            {isDc ? PEC_TABLES.DC_RESISTANCE.number : PEC_TABLES.AC_RESISTANCE_REACTANCE.number}{" "}
            (p. {isDc ? PEC_TABLES.DC_RESISTANCE.page : PEC_TABLES.AC_RESISTANCE_REACTANCE.page})
          </p>
        </div>
      )}

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
