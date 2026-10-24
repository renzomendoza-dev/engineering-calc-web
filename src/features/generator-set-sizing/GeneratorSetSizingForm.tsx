"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { RadioOption } from "@/components/ui/RadioGroupField";
import { RowList } from "@/features/sprinkler-hydraulics/RowList";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useGeneratorSetReference } from "@/hooks/useGeneratorSetReference";
import { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import { apiPost } from "@/lib/api-client";
import { ConductorFields } from "./ConductorFields";
import { FirePumpSection } from "./FirePumpSection";
import {
  DirectLoadRow,
  LightingAreaRow,
  MotorRow,
  OtherLoadRow,
  ReceptacleGroupRow,
} from "./LoadInputs";
import { buildGeneratorSetRequest } from "./request";
import {
  activeLoadsOnly,
  generatorSetSchema,
  type GeneratorSetFormInput,
  type GeneratorSetFormValues,
} from "./schema";
import {
  GENERATOR_PHASE_LABELS,
  GENERATOR_PHASE_TYPES,
  OPTIONAL_STANDBY_CLASS,
  type GeneratorSetSizingRequest,
  type GeneratorSetSizingResponse,
} from "./types";

const baseResolver = zodResolver(generatorSetSchema);

/** Validates, and hands back, only the loads of the entry mode in use (see activeLoadsOnly). */
const resolver: Resolver<GeneratorSetFormInput, unknown, GeneratorSetFormValues> = (
  values,
  context,
  options,
) => baseResolver(activeLoadsOnly(values), context, options);

const loadEntryOptions: RadioOption[] = [
  { value: "BUILD", label: "Build it up from lighting, receptacles and motors" },
  { value: "DIRECT", label: "I have the building's total load" },
];

/** A pump not yet filled in: entered by horsepower to begin with. */
function emptyPump(): GeneratorSetFormInput["firePump"]["motor"] {
  return {
    entry: "HORSEPOWER",
    horsepowerLabel: "",
    voltage: undefined,
    fullLoadAmps: undefined,
    lockedRotorAmps: undefined,
  };
}

const defaultValues: GeneratorSetFormInput = {
  standbyClass: "",
  loadEntryMode: "BUILD",
  optionalTransfer: "",
  phaseType: "THREE_PHASE",
  voltage: "",
  lightingAreas: [],
  receptacleGroups: [],
  applyReceptacleDemandFactor: true,
  otherLoads: [],
  motors: [],
  directLoads: [],
  generatorPowerFactor: 0.8,
  spareCapacityPercent: 0,
  selectedGeneratorKva: undefined,
  designPreventsOverload: false,
  sizeOutputConductor: false,
  outputConductor: {
    ambientTempCelsius: 30,
    numberOfCurrentCarryingConductors: 3,
    numberOfParallelSets: 1,
    insulationType: "",
    conductorMaterial: "",
    terminationTempRatingCelsius: undefined,
  },
  includeFirePump: false,
  firePump: {
    motor: emptyPump(),
    includeJockey: false,
    jockey: emptyPump(),
    accessoryAmps: undefined,
    startStep: 1,
    startingCurrentPercent: 100,
    sizeSupplyRun: false,
    supplyRun: {
      ambientTempCelsius: 30,
      numberOfCurrentCarryingConductors: 3,
      numberOfParallelSets: 1,
      insulationType: "",
      conductorMaterial: "",
      terminationTempRatingCelsius: undefined,
      checkVoltageDrop: false,
      oneWayLengthMeters: undefined,
      conduitMaterial: "",
      startingPowerFactor: undefined,
      runningPowerFactor: undefined,
      cableStartingDropAllowancePercent: undefined,
    },
  },
  // Filled from the API's defaults once they load (see the effect below); blank skips the check.
  subtransientReactancePercent: undefined,
  maximumVoltageDipPercent: undefined,
};

const phaseOptions: SelectOption[] = GENERATOR_PHASE_TYPES.map((value) => ({
  value,
  label: GENERATOR_PHASE_LABELS[value],
}));

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{children}</h2>;
}

interface GeneratorSetSizingFormProps {
  onResult: (result: GeneratorSetSizingResponse) => void;
}

export function GeneratorSetSizingForm({ onResult }: GeneratorSetSizingFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GeneratorSetFormInput, unknown, GeneratorSetFormValues>({
    resolver,
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(
    setError,
    defaultValues,
  );

  const lighting = useFieldArray({ control, name: "lightingAreas" });
  const receptacles = useFieldArray({ control, name: "receptacleGroups" });
  const others = useFieldArray({ control, name: "otherLoads" });
  const motors = useFieldArray({ control, name: "motors" });
  const directs = useFieldArray({ control, name: "directLoads" });

  const reference = useGeneratorSetReference();
  const wireReference = useWireSizingReferenceData();
  const referenceDisabled = reference.isLoading || !!reference.error;

  const standbyClass = watch("standbyClass");
  const optionalTransfer = watch("optionalTransfer");
  const phaseType = watch("phaseType");
  const systemVoltageInput = watch("voltage");
  const sizeOutputConductor = watch("sizeOutputConductor");
  const loadEntryMode = watch("loadEntryMode");
  const includeFirePump = watch("includeFirePump");
  const isDirect = loadEntryMode === "DIRECT";
  // Motor starting applies to motors (only in the build-up mode) and to the fire pump.
  const hasStartingLoads = includeFirePump || (!isDirect && motors.fields.length > 0);

  const isOptional = standbyClass === OPTIONAL_STANDBY_CLASS;
  const selectedClass = reference.standbyClasses.find((entry) => entry.key === standbyClass);
  const selectedTransfer = reference.optionalTransfers.find(
    (entry) => entry.key === optionalTransfer,
  );
  const systemVoltage = Number(systemVoltageInput) > 0 ? Number(systemVoltageInput) : undefined;

  // Start the motor starting check from the API's defaults, once, when they arrive: they are the
  // API's figures (and not PEC values), so the form does not keep its own copy. Clearing the fields
  // afterwards skips the check, so the defaults are never re-applied.
  const startingDefaultsApplied = useRef(false);
  useEffect(() => {
    if (startingDefaultsApplied.current || reference.isLoading || reference.error) return;
    startingDefaultsApplied.current = true;
    setValue("subtransientReactancePercent", reference.defaultSubtransientReactancePercent);
    setValue("maximumVoltageDipPercent", reference.defaultMaximumVoltageDipPercent);
  }, [
    reference.isLoading,
    reference.error,
    reference.defaultSubtransientReactancePercent,
    reference.defaultMaximumVoltageDipPercent,
    setValue,
  ]);

  // A transfer mode belongs to optional standby only, so it is cleared when another class is picked.
  useEffect(() => {
    if (!isOptional) {
      setValue("optionalTransfer", "");
    }
  }, [isOptional, setValue]);

  // Motors are looked up per phase: three-phase and single-phase motors have different horsepower
  // ranges and voltages, so a change of phase clears each motor's choice rather than keep one that
  // may not exist. Skipped on the first render so a fresh form is not touched.
  const previousPhase = useRef(phaseType);
  useEffect(() => {
    if (previousPhase.current === phaseType) return;
    previousPhase.current = phaseType;
    const count = getValues("motors").length;
    for (let i = 0; i < count; i += 1) {
      setValue(`motors.${i}.horsepowerLabel`, "");
      setValue(`motors.${i}.voltage`, "");
    }
    // The fire pump and its jockey are looked up the same way.
    for (const pump of ["motor", "jockey"] as const) {
      setValue(`firePump.${pump}.horsepowerLabel`, "");
      setValue(`firePump.${pump}.voltage`, undefined);
    }
  }, [phaseType, getValues, setValue]);

  const standbyClassOptions: SelectOption[] = [
    { value: "", label: reference.isLoading ? "Loading…" : "Select the standby class" },
    ...reference.standbyClasses.map((entry) => ({ value: entry.key, label: entry.label })),
  ];
  const transferOptions: SelectOption[] = [
    { value: "", label: reference.isLoading ? "Loading…" : "Select how load is transferred" },
    ...reference.optionalTransfers.map((entry) => ({ value: entry.key, label: entry.label })),
  ];
  const loadsError = isDirect
    ? (errors.directLoads?.root?.message ?? errors.directLoads?.message)
    : (errors.lightingAreas?.root?.message ?? errors.lightingAreas?.message);

  const onSubmit = async (values: GeneratorSetFormValues) => {
    setGeneralError(null);
    try {
      const result = await apiPost<GeneratorSetSizingRequest, GeneratorSetSizingResponse>(
        "/api/electrical/generator-set-sizing",
        buildGeneratorSetRequest(values),
      );
      onResult(result);
    } catch (err) {
      handleApiError(err);
    }
  };

  const rowProps = (
    index: number,
    list: { insert: (i: number, value: never) => void; remove: (i: number) => void },
    path: "lightingAreas" | "receptacleGroups" | "otherLoads" | "motors" | "directLoads",
  ) => ({
    index,
    register,
    errors,
    onDuplicate: () => list.insert(index + 1, getValues(`${path}.${index}`) as never),
    onRemove: () => list.remove(index),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {(reference.error || wireReference.error) && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load reference data ({reference.error ?? wireReference.error}).
        </div>
      )}

      <section className="flex flex-col gap-4">
        <SectionHeading>Standby system</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Standby class"
            options={standbyClassOptions}
            disabled={referenceDisabled}
            error={errors.standbyClass?.message}
            hint={
              selectedClass
                ? `Capacity rule: PEC ${selectedClass.capacityCitation}`
                : "Emergency, legally required or optional standby (PEC Chapter 7)."
            }
            {...register("standbyClass")}
          />
          {isOptional && (
            <SelectField
              label="Transfer"
              options={transferOptions}
              disabled={referenceDisabled}
              error={errors.optionalTransfer?.message}
              hint={
                selectedTransfer
                  ? `PEC ${selectedTransfer.citation}: ${selectedTransfer.text}`
                  : "Decides the capacity rule in PEC 7.2.1.4(B)."
              }
              {...register("optionalTransfer")}
            />
          )}
          <SelectField
            label="Phase"
            options={phaseOptions}
            error={errors.phaseType?.message}
            {...register("phaseType")}
          />
          <NumberField
            label="System voltage"
            unit="V"
            hint="Line-to-line, at the generator."
            error={errors.voltage?.message}
            {...register("voltage")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Loads on the generator</SectionHeading>
        <RadioGroupField
          legend="How do you want to enter the load?"
          options={loadEntryOptions}
          {...register("loadEntryMode")}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isDirect
            ? "Enter the building's total load as a figure. It is taken as the load to carry, so give it after your own demand factors. A fire pump is entered in its own section below."
            : "List the loads that will run together on the set. The load is built the way PEC Article 2.20 builds a feeder load."}
        </p>
        {loadsError && <p className="text-xs text-red-600 dark:text-red-400">{loadsError}</p>}

        {isDirect && (
          <RowList
            itemLabel="total load"
            count={directs.fields.length}
            onAdd={() =>
              directs.append({
                label: "",
                amount: "",
                unit: "KVA",
                powerFactor: undefined,
                continuous: true,
              })
            }
          >
            {directs.fields.map((field, index) => (
              <DirectLoadRow
                key={field.id}
                {...rowProps(index, directs, "directLoads")}
                watch={watch}
              />
            ))}
          </RowList>
        )}

        {!isDirect && (
          <>
            <RowList
              itemLabel="lighting area"
              count={lighting.fields.length}
              onAdd={() =>
                lighting.append({
                  label: "",
                  occupancy: "",
                  areaType: "GENERAL",
                  floorAreaM2: "",
                  unitLoadVoltAmperesPerM2: undefined,
                  entireLightingUsedAtOnce: false,
                  continuous: true,
                })
              }
            >
              {lighting.fields.map((field, index) => (
                <LightingAreaRow
                  key={field.id}
                  {...rowProps(index, lighting, "lightingAreas")}
                  watch={watch}
                  setValue={setValue}
                  reference={reference}
                  referenceDisabled={referenceDisabled}
                />
              ))}
            </RowList>

            <RowList
              itemLabel="receptacle group"
              count={receptacles.fields.length}
              onAdd={() =>
                receptacles.append({
                  label: "",
                  outlets: "",
                  bankOrOfficeFloorAreaM2: undefined,
                  continuous: false,
                })
              }
            >
              {receptacles.fields.map((field, index) => (
                <ReceptacleGroupRow
                  key={field.id}
                  {...rowProps(index, receptacles, "receptacleGroups")}
                />
              ))}
            </RowList>

            {receptacles.fields.length > 0 && (
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                  {...register("applyReceptacleDemandFactor")}
                />
                Apply the receptacle demand factor (Table 2.20.3.5)
              </label>
            )}

            <RowList
              itemLabel="other load"
              count={others.fields.length}
              onAdd={() =>
                others.append({
                  label: "",
                  voltAmperes: "",
                  demandFactorPercent: 100,
                  continuous: false,
                })
              }
            >
              {others.fields.map((field, index) => (
                <OtherLoadRow key={field.id} {...rowProps(index, others, "otherLoads")} />
              ))}
            </RowList>

            <RowList
              itemLabel="motor"
              count={motors.fields.length}
              onAdd={() =>
                motors.append({
                  label: "",
                  horsepowerLabel: "",
                  voltage: "",
                  quantity: 1,
                  startStep: 1,
                  startingCurrentPercent: 100,
                })
              }
            >
              {motors.fields.map((field, index) => (
                <MotorRow
                  key={field.id}
                  {...rowProps(index, motors, "motors")}
                  watch={watch}
                  setValue={setValue}
                  phaseType={phaseType}
                  systemVoltage={systemVoltage}
                />
              ))}
            </RowList>
          </>
        )}
      </section>

      <FirePumpSection
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        phaseType={phaseType}
        systemVoltage={systemVoltage}
        reference={reference}
        wireReference={wireReference}
      />

      {hasStartingLoads && (
        <section className="flex flex-col gap-4">
          <SectionHeading>Motor starting</SectionHeading>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Checks the voltage dip when the{" "}
            {includeFirePump && (isDirect || motors.fields.length === 0)
              ? "fire pump starts"
              : includeFirePump
                ? "motors and the fire pump start"
                : "motors start"}
            , from the locked-rotor kVA. Clear both fields to skip it.{" "}
            {reference.motorStartingDefaultsNote}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Generator subtransient reactance"
              unit="%"
              hint="X″d from the generator data sheet."
              error={errors.subtransientReactancePercent?.message}
              {...register("subtransientReactancePercent")}
            />
            <NumberField
              label="Maximum voltage dip"
              unit="%"
              hint="The largest dip you accept when a motor starts."
              error={errors.maximumVoltageDipPercent?.message}
              {...register("maximumVoltageDipPercent")}
            />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <SectionHeading>Generator set</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Rating power factor"
            hint={
              reference.defaultGeneratorPowerFactorNote ||
              "Not a PEC value; use the nameplate of the set."
            }
            error={errors.generatorPowerFactor?.message}
            {...register("generatorPowerFactor")}
          />
          <NumberField
            label="Spare capacity"
            unit="%"
            hint="Added over the demand load. Not a PEC value; 0 for none."
            error={errors.spareCapacityPercent?.message}
            {...register("spareCapacityPercent")}
          />
          <NumberField
            label="Set to check (optional)"
            unit="kVA"
            hint="Blank takes the next standard size up."
            error={errors.selectedGeneratorKva?.message}
            {...register("selectedGeneratorKva")}
          />
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              {...register("designPreventsOverload")}
            />
            The generator&apos;s design does not permit overloading
          </span>
          <span className="pl-6 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Sizes the output conductors at 100% of nameplate current instead of 115% (PEC
            4.45.1.13).
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Output conductors</SectionHeading>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            {...register("sizeOutputConductor")}
          />
          Also size the conductors from the generator terminals
        </label>
        {sizeOutputConductor && (
          <ConductorFields
            prefix="outputConductor"
            register={register}
            errors={errors.outputConductor}
            wireReference={wireReference}
            parallelHint="Large sets usually need more than one."
          />
        )}
      </section>

      <FormErrorBanner message={generalError} />

      <SubmitButton
        isSubmitting={isSubmitting}
        label="Size generator set"
        submittingLabel="Sizing…"
      />
    </form>
  );
}
