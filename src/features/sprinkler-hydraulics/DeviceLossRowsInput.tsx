"use client";

import { useFieldArray } from "react-hook-form";
import { UNITS } from "./labels";
import { RowActions, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";

interface DeviceLossRowsInputProps {
  form: SprinklerForm;
}

const INPUT_CLASS =
  "w-full rounded-md border bg-white px-2 py-1.5 text-base shadow-sm outline-none transition-colors sm:text-sm dark:bg-zinc-950";
const OK_BORDER =
  "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700";
const ERROR_BORDER = "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500";

/**
 * Fixed pressure losses through devices on the supply side — alarm valve, backflow preventer,
 * flow meter. Each is added to the required pressure as a flat psi figure, taken from the
 * device's listing; nothing here is calculated from flow. One line per device.
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
      compact
      itemLabel="device"
      count={fields.length}
      onAdd={() => append({ name: "", pressureLossPsi: 0 })}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.deviceLosses?.[index];
        const messages = [rowErrors?.name?.message, rowErrors?.pressureLossPsi?.message].filter(
          Boolean,
        );
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)_auto] items-end gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Device, e.g. alarm valve
                </span>
                <input
                  type="text"
                  aria-label={`Device ${index + 1} name`}
                  aria-invalid={!!rowErrors?.name}
                  className={`${INPUT_CLASS} ${rowErrors?.name ? ERROR_BORDER : OK_BORDER}`}
                  {...register(`deviceLosses.${index}.name`)}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Loss ({UNITS.pressure})
                </span>
                <input
                  type="number"
                  step="any"
                  aria-label={`Device ${index + 1} pressure loss in ${UNITS.pressure}`}
                  aria-invalid={!!rowErrors?.pressureLossPsi}
                  className={`${INPUT_CLASS} ${rowErrors?.pressureLossPsi ? ERROR_BORDER : OK_BORDER}`}
                  {...register(`deviceLosses.${index}.pressureLossPsi`)}
                />
              </label>
              <RowActions
                describedAs={`device ${index + 1}`}
                onDuplicate={() => insert(index + 1, { ...watch(`deviceLosses.${index}`) })}
                onRemove={() => remove(index)}
              />
            </div>
            {messages.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">{messages.join(" · ")}</p>
            )}
          </div>
        );
      })}
    </RowList>
  );
}
