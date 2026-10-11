"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { UNITS } from "./labels";
import { RowCard, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";

interface SprinklerRowsInputProps {
  form: SprinklerForm;
}

/**
 * The flowing sprinklers in the remote area. Each row's node id has to match the upstream node of
 * a pipe segment — that's how the API connects the network — so the ids are free text rather than
 * a dropdown, and the API reports any node that doesn't connect.
 */
export function SprinklerRowsInput({ form }: SprinklerRowsInputProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove, insert } = useFieldArray({ control, name: "sprinklers" });
  const defaultKFactor = watch("defaultKFactor");

  return (
    <RowList
      itemLabel="sprinkler"
      count={fields.length}
      onAdd={() => append({ nodeId: "", kFactor: defaultKFactor, coverageAreaSqFt: 0 })}
      error={errors.sprinklers?.message ?? errors.sprinklers?.root?.message}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.sprinklers?.[index];
        return (
          <RowCard
            key={field.id}
            title={`Sprinkler ${index + 1}`}
            describedAs={`sprinkler ${index + 1}`}
            onDuplicate={() => insert(index + 1, { ...watch(`sprinklers.${index}`) })}
            onRemove={() => remove(index)}
            removeDisabled={fields.length === 1}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                label="Node id"
                hint="e.g. S1"
                error={rowErrors?.nodeId?.message}
                {...register(`sprinklers.${index}.nodeId`)}
              />
              <NumberField
                label="K factor"
                error={rowErrors?.kFactor?.message}
                {...register(`sprinklers.${index}.kFactor`)}
              />
              <NumberField
                label="Coverage area"
                unit={UNITS.area}
                error={rowErrors?.coverageAreaSqFt?.message}
                {...register(`sprinklers.${index}.coverageAreaSqFt`)}
              />
            </div>
          </RowCard>
        );
      })}
    </RowList>
  );
}
