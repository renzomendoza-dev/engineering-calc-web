"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { RowList } from "@/features/sprinkler-hydraulics/RowList";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useGeneratorSetReference } from "@/hooks/useGeneratorSetReference";
import { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import { apiPost } from "@/lib/api-client";
import { LightingAreaRow, MotorRow, OtherLoadRow, ReceptacleGroupRow } from "./LoadInputs";
import { buildGeneratorSetRequest } from "./request";
import {
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

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const defaultValues: GeneratorSetFormInput = {
  standbyClass: "",
  optionalTransfer: "",
  phaseType: "THREE_PHASE",
  voltage: "",
  lightingAreas: [],
  receptacleGroups: [],
  applyReceptacleDemandFactor: true,
  otherLoads: [],
  motors: [],
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
};

const phaseOptions: SelectOption[] = GENERATOR_PHASE_TYPES.map((value) => ({
  value,
  label: GENERATOR_PHASE_LABELS[value],
}));

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{children}</h2>
  );
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
    resolver: zodResolver(generatorSetSchema),
    defaultValues,
  });
  const { generalError, setGeneralError, handleApiError } = useApiFormError(setError, defaultValues);

  const lighting = useFieldArray({ control, name: "lightingAreas" });
  const receptacles = useFieldArray({ control, name: "receptacleGroups" });
  const others = useFieldArray({ control, name: "otherLoads" });
  const motors = useFieldArray({ control, name: "motors" });

  const reference = useGeneratorSetReference();
  const wireReference = useWireSizingReferenceData();
  const referenceDisabled = reference.isLoading || !!reference.error;
  const wireReferenceDisabled = wireReference.isLoading || !!wireReference.error;

  const standbyClass = watch("standbyClass");
  const optionalTransfer = watch("optionalTransfer");
  const phaseType = watch("phaseType");
  const systemVoltageInput = watch("voltage");
  const sizeOutputConductor = watch("sizeOutputConductor");

  const isOptional = standbyClass === OPTIONAL_STANDBY_CLASS;
  const selectedClass = reference.standbyClasses.find((entry) => entry.key === standbyClass);
  const selectedTransfer = reference.optionalTransfers.find((entry) => entry.key === optionalTransfer);
  const systemVoltage = Number(systemVoltageInput) > 0 ? Number(systemVoltageInput) : undefined;

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
  }, [phaseType, getValues, setValue]);

  const standbyClassOptions: SelectOption[] = [
    { value: "", label: reference.isLoading ? "Loading…" : "Select the standby class" },
    ...reference.standbyClasses.map((entry) => ({ value: entry.key, label: entry.label })),
  ];
  const transferOptions: SelectOption[] = [
    { value: "", label: reference.isLoading ? "Loading…" : "Select how load is transferred" },
    ...reference.optionalTransfers.map((entry) => ({ value: entry.key, label: entry.label })),
  ];
  const insulationTypeOptions: SelectOption[] = [
    { value: "", label: wireReference.isLoading ? "Loading…" : "Select insulation type" },
    ...wireReference.insulationTypes.map((type) => ({ value: type, label: type })),
  ];
  const conductorMaterialOptions: SelectOption[] = [
    { value: "", label: wireReference.isLoading ? "Loading…" : "Select a material" },
    ...wireReference.conductorMaterials.map((material) => ({
      value: material,
      label: titleCase(material),
    })),
  ];
  const terminationOptions: SelectOption[] = [
    { value: "", label: wireReference.isLoading ? "Loading…" : "Select a rating" },
    ...wireReference.terminationTempRatings.map((rating) => ({
      value: String(rating),
      label: `${rating}°C`,
    })),
  ];

  const loadsError = errors.lightingAreas?.root?.message ?? errors.lightingAreas?.message;

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

  const rowProps = (index: number, list: { insert: (i: number, value: never) => void; remove: (i: number) => void }, path: "lightingAreas" | "receptacleGroups" | "otherLoads" | "motors") => ({
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          List the loads that will run together on the set. The load is built the way PEC Article
          2.20 builds a feeder load.
        </p>
        {loadsError && <p className="text-xs text-red-600 dark:text-red-400">{loadsError}</p>}

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
            <ReceptacleGroupRow key={field.id} {...rowProps(index, receptacles, "receptacleGroups")} />
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
            motors.append({ label: "", horsepowerLabel: "", voltage: "", quantity: 1 })
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
      </section>

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
            Sizes the output conductors at 100% of nameplate current instead of 115% (PEC 4.45.1.13).
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
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800">
            <SelectField
              label="Insulation type"
              options={insulationTypeOptions}
              disabled={wireReferenceDisabled}
              error={errors.outputConductor?.insulationType?.message}
              {...register("outputConductor.insulationType")}
            />
            <SelectField
              label="Conductor material"
              options={conductorMaterialOptions}
              disabled={wireReferenceDisabled}
              error={errors.outputConductor?.conductorMaterial?.message}
              {...register("outputConductor.conductorMaterial")}
            />
            <SelectField
              label="Termination temperature rating"
              options={terminationOptions}
              disabled={wireReferenceDisabled}
              error={errors.outputConductor?.terminationTempRatingCelsius?.message}
              {...register("outputConductor.terminationTempRatingCelsius")}
            />
            <NumberField
              label="Ambient temperature"
              unit="°C"
              error={errors.outputConductor?.ambientTempCelsius?.message}
              {...register("outputConductor.ambientTempCelsius")}
            />
            <NumberField
              label="Current-carrying conductors"
              hint="In the same raceway."
              error={errors.outputConductor?.numberOfCurrentCarryingConductors?.message}
              {...register("outputConductor.numberOfCurrentCarryingConductors")}
            />
            <NumberField
              label="Parallel sets"
              hint="Large sets usually need more than one."
              error={errors.outputConductor?.numberOfParallelSets?.message}
              {...register("outputConductor.numberOfParallelSets")}
            />
          </div>
        )}
      </section>

      <FormErrorBanner message={generalError} />

      <SubmitButton isSubmitting={isSubmitting} label="Size generator set" submittingLabel="Sizing…" />
    </form>
  );
}
