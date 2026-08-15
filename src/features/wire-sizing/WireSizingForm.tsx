"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import { CIRCUIT_TYPES } from "@/features/voltage-drop/types";
import { wireSizingSchema, type WireSizingFormInput, type WireSizingFormValues } from "./schema";
import type { WireSizingRequest, WireSizingResponse } from "./types";

const CIRCUIT_TYPE_LABELS: Record<(typeof CIRCUIT_TYPES)[number], string> = {
  DC: "DC",
  SINGLE_PHASE_AC: "Single-Phase AC",
  THREE_PHASE_AC: "Three-Phase AC",
};

// Unlike voltage-drop's own circuitType select (always required, defaults straight to
// THREE_PHASE_AC), this one starts unselected — the voltage drop check sub-section can be
// toggled off entirely — so it needs an empty placeholder option voltage-drop's list doesn't.
const circuitTypeOptions: SelectOption[] = [
  { value: "", label: "Select circuit type" },
  ...CIRCUIT_TYPES.map((value) => ({
    value,
    label: CIRCUIT_TYPE_LABELS[value],
  })),
];

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** conduitMaterial default forced on DC — see schema.ts's Javadoc-style comment for why. */
const DC_CONDUIT_MATERIAL_PLACEHOLDER = "PVC";

const defaultValues: WireSizingFormInput = {
  loadCurrentAmps: 0,
  isContinuousLoad: false,
  ambientTempCelsius: 30,
  numberOfCurrentCarryingConductors: 3,
  insulationType: "",
  conductorMaterial: "",
  terminationTempRatingCelsius: "" as unknown as WireSizingFormInput["terminationTempRatingCelsius"],
  includeVoltageDropCheck: false,
  voltageDropCheck: {
    circuitType: "",
    oneWayLengthMeters: undefined,
    powerFactor: undefined,
    systemVoltage: undefined,
    conduitMaterial: "",
    parallelSetsPerPhase: 1,
  },
};

interface WireSizingFormProps {
  onResult: (result: WireSizingResponse) => void;
}

export function WireSizingForm({ onResult }: WireSizingFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WireSizingFormInput, unknown, WireSizingFormValues>({
    resolver: zodResolver(wireSizingSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const {
    insulationTypes,
    conductorMaterials,
    conduitMaterials,
    terminationTempRatings,
    isLoading: referenceLoading,
    error: referenceError,
  } = useWireSizingReferenceData();

  const includeVoltageDropCheck = watch("includeVoltageDropCheck");
  const vdCircuitType = watch("voltageDropCheck.circuitType");
  const isDc = vdCircuitType === "DC";

  // Clear the voltage drop check sub-section when it's toggled off, so a stale value from
  // the previously-visible fields never gets silently submitted.
  useEffect(() => {
    if (!includeVoltageDropCheck) {
      setValue("voltageDropCheck.circuitType", "");
      setValue("voltageDropCheck.oneWayLengthMeters", undefined);
      setValue("voltageDropCheck.powerFactor", undefined);
      setValue("voltageDropCheck.systemVoltage", undefined);
      setValue("voltageDropCheck.conduitMaterial", "");
      setValue("voltageDropCheck.parallelSetsPerPhase", 1);
    }
  }, [includeVoltageDropCheck, setValue]);

  // VoltageDropCheckRequestDto.conduitMaterial is required by the backend even for DC (it's
  // ignored in the DC calculation but still validated as non-blank "for API consistency" —
  // see ConductorPropertiesResolver's Javadoc). So the field is hidden from the user for DC
  // (it's meaningless to them), but a valid value still has to go out on the wire — defaulted
  // here rather than left blank. Cleared back out when leaving DC so the field doesn't show a
  // stale auto-picked value once it reappears for AC.
  useEffect(() => {
    if (!includeVoltageDropCheck) return;
    setValue("voltageDropCheck.conduitMaterial", isDc ? DC_CONDUIT_MATERIAL_PLACEHOLDER : "");
  }, [isDc, includeVoltageDropCheck, setValue]);

  const referenceFieldsDisabled = referenceLoading || !!referenceError;

  const insulationTypeOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select insulation type" },
    ...insulationTypes.map((type) => ({ value: type, label: type })),
  ];
  const conductorMaterialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...conductorMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];
  const conduitMaterialOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a material" },
    ...conduitMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];
  const terminationTempRatingOptions: SelectOption[] = [
    { value: "", label: referenceLoading ? "Loading…" : "Select a rating" },
    ...terminationTempRatings.map((value) => ({ value: String(value), label: `${value}°C` })),
  ];

  const onSubmit = async (values: WireSizingFormValues) => {
    setGeneralError(null);

    const request: WireSizingRequest = {
      loadCurrentAmps: values.loadCurrentAmps,
      isContinuousLoad: values.isContinuousLoad,
      ambientTempCelsius: values.ambientTempCelsius,
      numberOfCurrentCarryingConductors: values.numberOfCurrentCarryingConductors,
      insulationType: values.insulationType,
      conductorMaterial: values.conductorMaterial || "COPPER",
      terminationTempRatingCelsius: values.terminationTempRatingCelsius,
      voltageDropCheck: values.includeVoltageDropCheck
        ? {
            circuitType: values.voltageDropCheck.circuitType || "THREE_PHASE_AC",
            oneWayLengthMeters: values.voltageDropCheck.oneWayLengthMeters ?? 0,
            powerFactor:
              values.voltageDropCheck.circuitType === "DC"
                ? 0
                : (values.voltageDropCheck.powerFactor ?? 1),
            systemVoltage: values.voltageDropCheck.systemVoltage ?? 0,
            conduitMaterial: values.voltageDropCheck.conduitMaterial || "PVC",
            parallelSetsPerPhase: values.voltageDropCheck.parallelSetsPerPhase ?? 1,
          }
        : null,
    };

    try {
      const result = await apiPost<WireSizingRequest, WireSizingResponse>(
        "/api/electrical/wire-sizing",
        request,
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Load Current"
          unit="A"
          error={errors.loadCurrentAmps?.message}
          {...register("loadCurrentAmps")}
        />
        <NumberField
          label="Ambient Temperature"
          unit="°C"
          error={errors.ambientTempCelsius?.message}
          {...register("ambientTempCelsius")}
        />
        <NumberField
          label="Current-Carrying Conductors"
          error={errors.numberOfCurrentCarryingConductors?.message}
          {...register("numberOfCurrentCarryingConductors")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            {...register("isContinuousLoad")}
          />
          Continuous Load
        </label>
        <p className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
          Loads running 3+ hours require 125% sizing per PEC.
        </p>
      </div>

      {referenceError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load reference data ({referenceError}).
        </div>
      )}

      <SelectField
        label="Insulation Type"
        options={insulationTypeOptions}
        disabled={referenceFieldsDisabled}
        error={errors.insulationType?.message}
        {...register("insulationType")}
      />
      <SelectField
        label="Conductor Material"
        options={conductorMaterialOptions}
        disabled={referenceFieldsDisabled}
        error={errors.conductorMaterial?.message}
        {...register("conductorMaterial")}
      />
      <SelectField
        label="Termination Temperature Rating"
        options={terminationTempRatingOptions}
        disabled={referenceFieldsDisabled}
        error={errors.terminationTempRatingCelsius?.message}
        {...register("terminationTempRatingCelsius")}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          {...register("includeVoltageDropCheck")}
        />
        Also check voltage drop for this run
      </label>

      {includeVoltageDropCheck && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <SelectField
            label="Circuit Type"
            options={circuitTypeOptions}
            error={errors.voltageDropCheck?.circuitType?.message}
            {...register("voltageDropCheck.circuitType")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="One-Way Length"
              unit="m"
              error={errors.voltageDropCheck?.oneWayLengthMeters?.message}
              {...register("voltageDropCheck.oneWayLengthMeters")}
            />
            <NumberField
              label="Power Factor"
              disabled={isDc}
              error={errors.voltageDropCheck?.powerFactor?.message}
              {...register("voltageDropCheck.powerFactor")}
            />
            <NumberField
              label="System Voltage"
              unit="V"
              error={errors.voltageDropCheck?.systemVoltage?.message}
              {...register("voltageDropCheck.systemVoltage")}
            />
            <NumberField
              label="Parallel Sets per Phase"
              error={errors.voltageDropCheck?.parallelSetsPerPhase?.message}
              {...register("voltageDropCheck.parallelSetsPerPhase")}
            />
          </div>
          {!isDc && (
            <SelectField
              label="Conduit Material"
              options={conduitMaterialOptions}
              disabled={referenceFieldsDisabled}
              error={errors.voltageDropCheck?.conduitMaterial?.message}
              {...register("voltageDropCheck.conduitMaterial")}
            />
          )}
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
