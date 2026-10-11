"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { UNITS } from "./labels";
import { materialOptions, scheduleOptions, sizeOptions } from "./pipeOptions";
import { RowCard, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";

interface SupplyPipeRunsInputProps {
  form: SprinklerForm;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
}

/**
 * The pipe between a gravity tank and the system's connection. Same shape as a network segment
 * minus the parts that don't apply: no node ids, because the supply side is one path rather than
 * a tree, and no elevation change, because the tank's height is entered once above and counting
 * it twice would invent pressure.
 *
 * Fittings aren't entered per run yet — the hint says to fold their equivalent length into the
 * length, which is what the figure is for. The API accepts them, so the field can be added later
 * without a contract change.
 */
export function SupplyPipeRunsInput({ form, materials, materialsLoading }: SupplyPipeRunsInputProps) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove, insert } = useFieldArray({ control, name: "gravityTank.outletRuns" });

  const defaultMaterial = watch("defaultPipeMaterial");
  const defaultSchedule = watch("defaultSchedule");
  const defaultCFactor = watch("defaultCFactor");

  return (
    <RowList
      itemLabel="pipe run"
      count={fields.length}
      onAdd={() =>
        append({
          pipeMaterial: defaultMaterial,
          schedule: defaultSchedule,
          nominalSize: sizeOptions(materials, defaultMaterial, defaultSchedule)[0]?.value ?? "",
          cFactor: defaultCFactor,
          pipeLengthFt: 0,
          fittings: [],
        })
      }
    >
      {fields.map((field, index) => {
        const rowErrors = errors.gravityTank?.outletRuns?.[index];
        const material = watch(`gravityTank.outletRuns.${index}.pipeMaterial`);
        const schedule = watch(`gravityTank.outletRuns.${index}.schedule`);
        const materialRegistration = register(`gravityTank.outletRuns.${index}.pipeMaterial`);

        const rowMaterialOptions: SelectOption[] = materialsLoading
          ? [{ value: material, label: "Loading…" }]
          : materialOptions(materials);
        const rowSizeOptions = sizeOptions(materials, material, schedule);

        return (
          <RowCard
            key={field.id}
            title={`Pipe run ${index + 1}`}
            describedAs={`pipe run ${index + 1}`}
            onDuplicate={() => insert(index + 1, { ...watch(`gravityTank.outletRuns.${index}`) })}
            onRemove={() => remove(index)}
          >
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
                  setValue(`gravityTank.outletRuns.${index}.schedule`, nextSchedule);
                  const sizes = sizeOptions(materials, event.target.value, nextSchedule);
                  const current = watch(`gravityTank.outletRuns.${index}.nominalSize`);
                  if (!sizes.some((size) => size.value === current)) {
                    setValue(`gravityTank.outletRuns.${index}.nominalSize`, sizes[0]?.value ?? "");
                  }
                }}
              />
              <SelectField
                label="Schedule"
                options={scheduleOptions(materials, material)}
                disabled={materialsLoading}
                error={rowErrors?.schedule?.message}
                {...register(`gravityTank.outletRuns.${index}.schedule`)}
              />
              <SelectField
                label="Nominal size"
                options={rowSizeOptions}
                disabled={materialsLoading || rowSizeOptions.length === 0}
                error={rowErrors?.nominalSize?.message}
                {...register(`gravityTank.outletRuns.${index}.nominalSize`)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                label="Length"
                unit={UNITS.length}
                hint="Include the equivalent length of any valves and fittings on this run."
                error={rowErrors?.pipeLengthFt?.message}
                {...register(`gravityTank.outletRuns.${index}.pipeLengthFt`)}
              />
              <NumberField
                label="C factor"
                error={rowErrors?.cFactor?.message}
                {...register(`gravityTank.outletRuns.${index}.cFactor`)}
              />
            </div>
          </RowCard>
        );
      })}
    </RowList>
  );
}
