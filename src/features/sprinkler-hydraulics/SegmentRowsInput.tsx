"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { UNITS } from "./labels";
import { materialOptions, scheduleOptions, sizeOptions } from "./pipeOptions";
import { RowCard, RowList } from "./RowList";
import { SegmentFittingsInput } from "./SegmentFittingsInput";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow } from "./types";

interface SegmentRowsInputProps {
  form: SprinklerForm;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: FittingEquivalentLengthTableRow[];
}

/**
 * The pipe segments between nodes. Each row is one pipe run: from the upstream node (a sprinkler
 * or a junction) to the node nearer the supply. Material, schedule, size and C factor start from
 * the step 2 defaults and are editable per row, since the API takes them per segment.
 *
 * The shape of the network is the API's business: it reports a loop or a disconnected node. This
 * form only makes sure a segment doesn't start and end at the same node.
 */
export function SegmentRowsInput({
  form,
  materials,
  materialsLoading,
  fittings,
}: SegmentRowsInputProps) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove, insert } = useFieldArray({ control, name: "segments" });

  const defaults = {
    pipeMaterial: watch("defaultPipeMaterial"),
    schedule: watch("defaultSchedule"),
    cFactor: watch("defaultCFactor"),
  };

  function addSegment() {
    append({
      fromNodeId: "",
      toNodeId: "",
      pipeMaterial: defaults.pipeMaterial,
      schedule: defaults.schedule,
      nominalSize: sizeOptions(materials, defaults.pipeMaterial, defaults.schedule)[0]?.value ?? "",
      cFactor: defaults.cFactor,
      pipeLengthFt: 0,
      elevationChangeFt: 0,
      fittings: [],
    });
  }

  return (
    <RowList
      itemLabel="pipe segment"
      count={fields.length}
      onAdd={addSegment}
      error={errors.segments?.message ?? errors.segments?.root?.message}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.segments?.[index];
        const material = watch(`segments.${index}.pipeMaterial`);
        const schedule = watch(`segments.${index}.schedule`);
        const materialRegistration = register(`segments.${index}.pipeMaterial`);
        const scheduleRegistration = register(`segments.${index}.schedule`);

        const rowMaterialOptions: SelectOption[] = materialsLoading
          ? [{ value: material, label: "Loading…" }]
          : materialOptions(materials);
        const rowScheduleOptions = scheduleOptions(materials, material);
        const rowSizeOptions = sizeOptions(materials, material, schedule);

        function resetDownstreamSize(nextMaterial: string, nextSchedule: string | undefined) {
          const sizes = sizeOptions(materials, nextMaterial, nextSchedule);
          const current = watch(`segments.${index}.nominalSize`);
          // Keep the chosen size when the new schedule also has it; otherwise fall back to its
          // first size so the row never holds a size the API would reject.
          if (!sizes.some((size) => size.value === current)) {
            setValue(`segments.${index}.nominalSize`, sizes[0]?.value ?? "", { shouldValidate: true });
          }
        }

        return (
          <RowCard
            key={field.id}
            title={`Segment ${index + 1}`}
            describedAs={`segment ${index + 1}`}
            onDuplicate={() => insert(index + 1, { ...watch(`segments.${index}`) })}
            onRemove={() => remove(index)}
            removeDisabled={fields.length === 1}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="From node (upstream)"
                hint="e.g. S1"
                error={rowErrors?.fromNodeId?.message}
                {...register(`segments.${index}.fromNodeId`)}
              />
              <TextField
                label="To node (towards the supply)"
                hint="e.g. RISER"
                error={rowErrors?.toNodeId?.message}
                {...register(`segments.${index}.toNodeId`)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField
                label="Pipe material"
                options={rowMaterialOptions}
                disabled={materialsLoading}
                error={rowErrors?.pipeMaterial?.message}
                {...materialRegistration}
                onChange={(event) => {
                  materialRegistration.onChange(event);
                  const nextSchedule = scheduleOptions(materials, event.target.value)[0]?.value ?? "";
                  setValue(`segments.${index}.schedule`, nextSchedule, { shouldValidate: true });
                  resetDownstreamSize(event.target.value, nextSchedule);
                }}
              />
              <SelectField
                label="Schedule"
                options={rowScheduleOptions}
                disabled={materialsLoading || rowScheduleOptions.length === 0}
                error={rowErrors?.schedule?.message}
                {...scheduleRegistration}
                onChange={(event) => {
                  scheduleRegistration.onChange(event);
                  resetDownstreamSize(material, event.target.value);
                }}
              />
              <SelectField
                label="Nominal size"
                options={rowSizeOptions}
                disabled={materialsLoading || rowSizeOptions.length === 0}
                error={rowErrors?.nominalSize?.message}
                {...register(`segments.${index}.nominalSize`)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumberField
                label="Pipe length"
                unit={UNITS.length}
                error={rowErrors?.pipeLengthFt?.message}
                {...register(`segments.${index}.pipeLengthFt`)}
              />
              <NumberField
                label="Elevation change"
                unit={UNITS.length}
                hint="Positive when the downstream node is higher."
                error={rowErrors?.elevationChangeFt?.message}
                {...register(`segments.${index}.elevationChangeFt`)}
              />
              <NumberField
                label="C factor"
                error={rowErrors?.cFactor?.message}
                {...register(`segments.${index}.cFactor`)}
              />
            </div>

            <SegmentFittingsInput form={form} segmentIndex={index} fittings={fittings} />
          </RowCard>
        );
      })}
    </RowList>
  );
}
