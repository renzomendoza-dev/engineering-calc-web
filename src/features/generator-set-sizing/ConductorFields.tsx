"use client";

import type { UseFormRegister } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import type { useWireSizingReferenceData } from "@/hooks/useWireSizingReferenceData";
import type { GeneratorSetFormInput } from "./schema";

/** The two places a conductor's conditions are entered: the generator output, and the run to a fire pump. */
export type ConductorPrefix = "outputConductor" | "firePump.supplyRun";

interface ConductorErrors {
  insulationType?: { message?: string };
  conductorMaterial?: { message?: string };
  terminationTempRatingCelsius?: { message?: string };
  ambientTempCelsius?: { message?: string };
  numberOfCurrentCarryingConductors?: { message?: string };
  numberOfParallelSets?: { message?: string };
}

interface ConductorFieldsProps {
  prefix: ConductorPrefix;
  register: UseFormRegister<GeneratorSetFormInput>;
  errors: ConductorErrors | undefined;
  wireReference: ReturnType<typeof useWireSizingReferenceData>;
  parallelHint?: string;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/**
 * The conductor conditions wire sizing needs, shared by the generator output and the fire pump run
 * so the two read the same: insulation, material, termination rating, ambient, conductor count and
 * parallel sets.
 */
export function ConductorFields({
  prefix,
  register,
  errors,
  wireReference,
  parallelHint = "Large runs usually need more than one.",
}: ConductorFieldsProps) {
  const disabled = wireReference.isLoading || !!wireReference.error;
  const loading = wireReference.isLoading;

  const insulationTypeOptions: SelectOption[] = [
    { value: "", label: loading ? "Loading…" : "Select insulation type" },
    ...wireReference.insulationTypes.map((type) => ({ value: type, label: type })),
  ];
  const conductorMaterialOptions: SelectOption[] = [
    { value: "", label: loading ? "Loading…" : "Select a material" },
    ...wireReference.conductorMaterials.map((material) => ({
      value: material,
      label: titleCase(material),
    })),
  ];
  const terminationOptions: SelectOption[] = [
    { value: "", label: loading ? "Loading…" : "Select a rating" },
    ...wireReference.terminationTempRatings.map((rating) => ({
      value: String(rating),
      label: `${rating}°C`,
    })),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800">
      <SelectField
        label="Insulation type"
        options={insulationTypeOptions}
        disabled={disabled}
        error={errors?.insulationType?.message}
        {...register(`${prefix}.insulationType`)}
      />
      <SelectField
        label="Conductor material"
        options={conductorMaterialOptions}
        disabled={disabled}
        error={errors?.conductorMaterial?.message}
        {...register(`${prefix}.conductorMaterial`)}
      />
      <SelectField
        label="Termination temperature rating"
        options={terminationOptions}
        disabled={disabled}
        error={errors?.terminationTempRatingCelsius?.message}
        {...register(`${prefix}.terminationTempRatingCelsius`)}
      />
      <NumberField
        label="Ambient temperature"
        unit="°C"
        error={errors?.ambientTempCelsius?.message}
        {...register(`${prefix}.ambientTempCelsius`)}
      />
      <NumberField
        label="Current-carrying conductors"
        hint="In the same raceway."
        error={errors?.numberOfCurrentCarryingConductors?.message}
        {...register(`${prefix}.numberOfCurrentCarryingConductors`)}
      />
      <NumberField
        label="Parallel sets"
        hint={parallelHint}
        error={errors?.numberOfParallelSets?.message}
        {...register(`${prefix}.numberOfParallelSets`)}
      />
    </div>
  );
}
