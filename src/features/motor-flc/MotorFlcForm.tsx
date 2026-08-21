"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { apiPost } from "@/lib/api-client";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useMotorReferenceData } from "@/hooks/useMotorReferenceData";
import { useMotorHorsepowerRatings } from "@/hooks/useMotorHorsepowerRatings";
import { useMotorVoltages } from "@/hooks/useMotorVoltages";
import { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import { CIRCUIT_TYPES } from "@/features/voltage-drop/types";
import { motorFlcSchema, type MotorFlcFormInput, type MotorFlcFormValues } from "./schema";
import type {
  MotorConductorSizingRequest,
  MotorConductorSizingResponse,
  MotorFlcFormResult,
  MotorFlcRequest,
  MotorFlcResponse,
} from "./types";

const CIRCUIT_TYPE_LABELS: Record<(typeof CIRCUIT_TYPES)[number], string> = {
  DC: "DC",
  SINGLE_PHASE_AC: "Single-Phase AC",
  THREE_PHASE_AC: "Three-Phase AC",
};

const circuitTypeOptions: SelectOption[] = [
  { value: "", label: "Select circuit type" },
  ...CIRCUIT_TYPES.map((value) => ({ value, label: CIRCUIT_TYPE_LABELS[value] })),
];

const SYNCHRONOUS_POWER_FACTOR_OPTIONS: SelectOption[] = [
  { value: "100", label: "100% (Unity)" },
  { value: "90", label: "90%" },
  { value: "80", label: "80%" },
];

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** conduitMaterial default forced on DC — see wire-sizing's schema.ts for why. */
const DC_CONDUIT_MATERIAL_PLACEHOLDER = "PVC";

const defaultValues: MotorFlcFormInput = {
  phaseType: "",
  motorClass: "",
  horsepowerLabel: "",
  voltage: undefined,
  synchronousPowerFactorPercent: 100,
  includeWireSizing: false,
  ambientTempCelsius: 30,
  numberOfCurrentCarryingConductors: 3,
  numberOfParallelSets: 1,
  insulationType: "",
  conductorMaterial: "",
  terminationTempRatingCelsius: "" as unknown as MotorFlcFormInput["terminationTempRatingCelsius"],
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

interface MotorFlcFormProps {
  onResult: (result: MotorFlcFormResult) => void;
}

export function MotorFlcForm({ onResult }: MotorFlcFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MotorFlcFormInput, unknown, MotorFlcFormValues>({
    resolver: zodResolver(motorFlcSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const { motorPhaseTypes, motorClasses, isLoading: motorRefLoading, error: motorRefError } =
    useMotorReferenceData();
  const {
    insulationTypes,
    conductorMaterials,
    conduitMaterials,
    terminationTempRatings,
    isLoading: wireSizingRefLoading,
    error: wireSizingRefError,
  } = useWireSizingReferenceData();

  const phaseType = watch("phaseType");
  const motorClass = watch("motorClass") ?? "";
  const horsepowerLabel = watch("horsepowerLabel");
  const includeWireSizing = watch("includeWireSizing");
  const includeVoltageDropCheck = watch("includeVoltageDropCheck");
  const vdCircuitType = watch("voltageDropCheck.circuitType");

  const isThreePhase = phaseType === "THREE_PHASE";
  const isSynchronous = isThreePhase && motorClass === "SYNCHRONOUS";
  const isVdDc = vdCircuitType === "DC";

  const {
    horsepowerRatings,
    isLoading: hpLoading,
    error: hpError,
  } = useMotorHorsepowerRatings(phaseType ?? "", motorClass, isThreePhase);
  const {
    voltages,
    isLoading: voltLoading,
    error: voltError,
  } = useMotorVoltages(phaseType ?? "", motorClass, isThreePhase, horsepowerLabel ?? "");

  // Dependent-chain resets: each downstream field clears whenever anything upstream of it
  // changes, so a stale selection from a no-longer-valid combination is never silently
  // submitted — same reasoning as conduit fill's per-row size reset on insulation type change.
  useEffect(() => {
    setValue("motorClass", "");
  }, [phaseType, setValue]);

  useEffect(() => {
    setValue("horsepowerLabel", "");
  }, [phaseType, motorClass, setValue]);

  useEffect(() => {
    setValue("voltage", undefined);
  }, [phaseType, motorClass, horsepowerLabel, setValue]);

  useEffect(() => {
    if (!isSynchronous) {
      setValue("synchronousPowerFactorPercent", 100);
    }
  }, [isSynchronous, setValue]);

  // Clear the wire sizing section (and everything nested under it) when toggled off.
  useEffect(() => {
    if (!includeWireSizing) {
      setValue("ambientTempCelsius", undefined);
      setValue("numberOfCurrentCarryingConductors", undefined);
      setValue("numberOfParallelSets", undefined);
      setValue("insulationType", "");
      setValue("conductorMaterial", "");
      setValue(
        "terminationTempRatingCelsius",
        "" as unknown as MotorFlcFormInput["terminationTempRatingCelsius"],
      );
      setValue("includeVoltageDropCheck", false);
    }
  }, [includeWireSizing, setValue]);

  // Clear the nested voltage drop check sub-section when toggled off.
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

  // When the voltage drop check is first turned on, default its own parallel-sets field to
  // match the top-level one — same reasoning as wire-sizing's own form.
  useEffect(() => {
    if (includeVoltageDropCheck) {
      setValue("voltageDropCheck.parallelSetsPerPhase", getValues("numberOfParallelSets") ?? 1);
    }
  }, [includeVoltageDropCheck, getValues, setValue]);

  // Same backend quirk wire-sizing's form compensates for: VoltageDropCheckRequestDto.conduitMaterial
  // is required even for DC (ignored in the DC calculation, but still validated non-blank).
  useEffect(() => {
    if (!includeVoltageDropCheck) return;
    setValue("voltageDropCheck.conduitMaterial", isVdDc ? DC_CONDUIT_MATERIAL_PLACEHOLDER : "");
  }, [isVdDc, includeVoltageDropCheck, setValue]);

  const motorRefDisabled = motorRefLoading || !!motorRefError;
  const wireSizingRefDisabled = wireSizingRefLoading || !!wireSizingRefError;

  const phaseTypeOptions: SelectOption[] = [
    { value: "", label: motorRefLoading ? "Loading…" : "Select phase type" },
    ...motorPhaseTypes.map((type) => ({ value: type, label: titleCase(type.replace(/_/g, " ")) })),
  ];
  const motorClassOptions: SelectOption[] = [
    { value: "", label: motorRefLoading ? "Loading…" : "Select motor class" },
    ...motorClasses.map((cls) => ({ value: cls, label: titleCase(cls) })),
  ];
  const horsepowerOptions: SelectOption[] = [
    {
      value: "",
      label: !phaseType
        ? "Select phase type first"
        : isThreePhase && !motorClass
          ? "Select motor class first"
          : hpLoading
            ? "Loading…"
            : "Select horsepower",
    },
    ...horsepowerRatings.map((hp) => ({ value: hp, label: `${hp} HP` })),
  ];
  const voltageOptions: SelectOption[] = [
    {
      value: "",
      label: !horsepowerLabel ? "Select horsepower first" : voltLoading ? "Loading…" : "Select voltage",
    },
    ...voltages.map((v) => ({ value: String(v), label: `${v} V` })),
  ];
  const insulationTypeOptions: SelectOption[] = [
    { value: "", label: wireSizingRefLoading ? "Loading…" : "Select insulation type" },
    ...insulationTypes.map((type) => ({ value: type, label: type })),
  ];
  const conductorMaterialOptions: SelectOption[] = [
    { value: "", label: wireSizingRefLoading ? "Loading…" : "Select a material" },
    ...conductorMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];
  const conduitMaterialOptions: SelectOption[] = [
    { value: "", label: wireSizingRefLoading ? "Loading…" : "Select a material" },
    ...conduitMaterials.map((material) => ({ value: material, label: titleCase(material) })),
  ];
  const terminationTempRatingOptions: SelectOption[] = [
    { value: "", label: wireSizingRefLoading ? "Loading…" : "Select a rating" },
    ...terminationTempRatings.map((value) => ({ value: String(value), label: `${value}°C` })),
  ];

  const onSubmit = async (values: MotorFlcFormValues) => {
    setGeneralError(null);

    const motorClassValue = isThreePhase ? values.motorClass || null : null;
    const synchronousPowerFactorPercent = isSynchronous
      ? (values.synchronousPowerFactorPercent ?? 100)
      : null;

    try {
      if (!values.includeWireSizing) {
        const request: MotorFlcRequest = {
          phaseType: values.phaseType,
          motorClass: motorClassValue,
          horsepowerLabel: values.horsepowerLabel,
          voltage: values.voltage,
          synchronousPowerFactorPercent,
        };
        const result = await apiPost<MotorFlcRequest, MotorFlcResponse>(
          "/api/electrical/motor-flc",
          request,
        );
        onResult({ kind: "flc", data: result });
        return;
      }

      const request: MotorConductorSizingRequest = {
        phaseType: values.phaseType,
        motorClass: motorClassValue,
        horsepowerLabel: values.horsepowerLabel,
        voltage: values.voltage,
        synchronousPowerFactorPercent,
        ambientTempCelsius: values.ambientTempCelsius ?? 30,
        numberOfCurrentCarryingConductors: values.numberOfCurrentCarryingConductors ?? 3,
        numberOfParallelSets: values.numberOfParallelSets ?? 1,
        insulationType: values.insulationType ?? "",
        conductorMaterial: values.conductorMaterial || "COPPER",
        terminationTempRatingCelsius: values.terminationTempRatingCelsius ?? 60,
        voltageDropCheck: values.includeVoltageDropCheck
          ? {
              circuitType: values.voltageDropCheck.circuitType || "THREE_PHASE_AC",
              oneWayLengthMeters: values.voltageDropCheck.oneWayLengthMeters ?? 0,
              powerFactor: isVdDc ? 0 : (values.voltageDropCheck.powerFactor ?? 1),
              systemVoltage: values.voltageDropCheck.systemVoltage ?? 0,
              conduitMaterial: values.voltageDropCheck.conduitMaterial || "PVC",
              parallelSetsPerPhase: values.voltageDropCheck.parallelSetsPerPhase ?? 1,
            }
          : null,
      };
      const result = await apiPost<MotorConductorSizingRequest, MotorConductorSizingResponse>(
        "/api/electrical/motor-conductor-sizing",
        request,
      );
      onResult({ kind: "pipeline", data: result });
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {motorRefError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load motor reference data ({motorRefError}).
        </div>
      )}

      <SelectField
        label="Phase Type"
        options={phaseTypeOptions}
        disabled={motorRefDisabled}
        error={errors.phaseType?.message}
        {...register("phaseType")}
      />

      {isThreePhase && (
        <SelectField
          label="Motor Class"
          options={motorClassOptions}
          disabled={motorRefDisabled}
          error={errors.motorClass?.message}
          {...register("motorClass")}
        />
      )}

      <SelectField
        label="Horsepower"
        options={horsepowerOptions}
        disabled={!phaseType || (isThreePhase && !motorClass) || hpLoading || !!hpError}
        error={errors.horsepowerLabel?.message ?? hpError ?? undefined}
        {...register("horsepowerLabel")}
      />

      <SelectField
        label="Voltage"
        options={voltageOptions}
        disabled={!horsepowerLabel || voltLoading || !!voltError}
        error={errors.voltage?.message ?? voltError ?? undefined}
        {...register("voltage")}
      />

      {isSynchronous && (
        <SelectField
          label="Synchronous Power Factor"
          options={SYNCHRONOUS_POWER_FACTOR_OPTIONS}
          error={errors.synchronousPowerFactorPercent?.message}
          {...register("synchronousPowerFactorPercent")}
        />
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          {...register("includeWireSizing")}
        />
        Also recommend a wire size for this motor
      </label>

      {includeWireSizing && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {wireSizingRefError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Couldn&apos;t load reference data ({wireSizingRefError}).
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Ambient Temperature"
              unit="°C"
              error={errors.ambientTempCelsius?.message}
              {...register("ambientTempCelsius")}
            />
            <NumberField
              label="Current-Carrying Conductors"
              tooltip="Total conductors sharing this conduit/raceway, from this circuit and any others pulled through it — not the number of strands in this wire. 3 or fewer means no derating."
              error={errors.numberOfCurrentCarryingConductors?.message}
              {...register("numberOfCurrentCarryingConductors")}
            />
            <NumberField
              label="Number of Wires"
              tooltip="How many identical conductors run in parallel to carry this motor's current — e.g. 2 if a single conductor sized for the full load would be too large or isn't listed in the table. All parallel conductors must match in size, material, and length. 1 is the normal single-conductor case."
              error={errors.numberOfParallelSets?.message}
              {...register("numberOfParallelSets")}
            />
          </div>

          <SelectField
            label="Insulation Type"
            options={insulationTypeOptions}
            disabled={wireSizingRefDisabled}
            error={errors.insulationType?.message}
            {...register("insulationType")}
          />
          <SelectField
            label="Conductor Material"
            options={conductorMaterialOptions}
            disabled={wireSizingRefDisabled}
            error={errors.conductorMaterial?.message}
            {...register("conductorMaterial")}
          />
          <SelectField
            label="Termination Temperature Rating"
            options={terminationTempRatingOptions}
            disabled={wireSizingRefDisabled}
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
                  disabled={isVdDc}
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
              {!isVdDc && (
                <SelectField
                  label="Conduit Material"
                  options={conduitMaterialOptions}
                  disabled={wireSizingRefDisabled}
                  error={errors.voltageDropCheck?.conduitMaterial?.message}
                  {...register("voltageDropCheck.conduitMaterial")}
                />
              )}
            </div>
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
