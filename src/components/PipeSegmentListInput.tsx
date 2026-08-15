"use client";

import type {
  Control,
  FieldArrayPath,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { DiameterSpecInput } from "@/components/DiameterSpecInput";
import { FRICTION_FACTOR_METHODS } from "@/lib/frictionFactorMethod";
import { DEFAULT_PIPE_SEGMENT } from "@/lib/pipeSegment";

const METHOD_LABELS: Record<(typeof FRICTION_FACTOR_METHODS)[number], string> = {
  SWAMEE_JAIN: "Swamee-Jain",
  COLEBROOK_WHITE: "Colebrook-White",
};

const methodOptions: SelectOption[] = FRICTION_FACTOR_METHODS.map((value) => ({
  value,
  label: METHOD_LABELS[value],
}));

interface RowErrors {
  nominalMaterial?: { message?: string };
  nominalSize?: { message?: string };
  rawDiameterValue?: { message?: string };
  rawDiameterUnit?: { message?: string };
  lengthMeters?: { message?: string };
  method?: { message?: string };
}

interface PipeSegmentListInputProps<T extends FieldValues> {
  control: Control<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors?: FieldErrors<T>;
  /** Dot-path to the segment list array field (e.g. "suctionSegments"). */
  name: string;
}

/**
 * Shared repeatable pipe-segment list (diameter spec + length + friction method), used for both
 * the suction and discharge piping sections on the pump TDH form. Unlike PumpCurvePointsInput's
 * minimum-2-row curve requirement, an empty list here is a legitimate result — e.g. no suction
 * piping when the pump sits directly in a flooded wet well — so no minimum row count is
 * enforced (see lib/pipeSegment.ts's un-`.min()`'d array schema).
 */
export function PipeSegmentListInput<T extends FieldValues>({
  control,
  register,
  watch,
  setValue,
  errors,
  name,
}: PipeSegmentListInputProps<T>) {
  const fieldArrayName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({ control, name: fieldArrayName });

  const rowErrorsList = errors
    ? ((errors as Record<string, unknown>)[name] as RowErrors[] | undefined)
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length === 0
            ? "No pipe segments"
            : `${fields.length} pipe segment${fields.length === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          onClick={() => append(DEFAULT_PIPE_SEGMENT as never)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add Segment
        </button>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const rowErrors = rowErrorsList?.[index];
            return (
              <div
                key={field.id}
                className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Segment {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove segment ${index + 1}`}
                    className="rounded-md border border-zinc-300 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path
                        d="M5 5l10 10M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <DiameterSpecInput
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={rowErrors as unknown as FieldErrors<T>}
                  namePrefix={`${name}.${index}`}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Length"
                    unit="m"
                    error={rowErrors?.lengthMeters?.message}
                    {...register(`${name}.${index}.lengthMeters` as Path<T>)}
                  />
                  <SelectField
                    label="Friction Factor Method"
                    options={methodOptions}
                    error={rowErrors?.method?.message}
                    {...register(`${name}.${index}.method` as Path<T>)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
