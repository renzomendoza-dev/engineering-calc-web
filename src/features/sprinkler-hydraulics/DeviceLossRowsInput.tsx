"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { UNITS } from "./labels";
import { RowCard, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";

interface DeviceLossRowsInputProps {
  form: SprinklerForm;
}

/**
 * Fixed pressure losses through devices on the supply side — alarm valve, backflow preventer,
 * flow meter. Each is added to the required pressure as a flat psi figure, taken from the
 * device's listing; nothing here is calculated from flow.
 */
export function DeviceLossRowsInput({ form }: DeviceLossRowsInputProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove, insert } = useFieldArray({ control, name: "deviceLosses" });

  return (
    <RowList
      itemLabel="device"
      count={fields.length}
      onAdd={() => append({ name: "", pressureLossPsi: 0 })}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.deviceLosses?.[index];
        return (
          <RowCard
            key={field.id}
            title={`Device ${index + 1}`}
            describedAs={`device ${index + 1}`}
            onDuplicate={() => insert(index + 1, { ...watch(`deviceLosses.${index}`) })}
            onRemove={() => remove(index)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Device"
                hint="e.g. Alarm valve"
                error={rowErrors?.name?.message}
                {...register(`deviceLosses.${index}.name`)}
              />
              <NumberField
                label="Pressure loss"
                unit={UNITS.pressure}
                error={rowErrors?.pressureLossPsi?.message}
                {...register(`deviceLosses.${index}.pressureLossPsi`)}
              />
            </div>
          </RowCard>
        );
      })}
    </RowList>
  );
}
