"use client";

import type {
  Control,
  FieldArrayPath,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";

interface PumpCurvePointsInputProps<T extends FieldValues> {
  control: Control<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors?: FieldErrors<T>;
  /** Dot-path to the curve points array field (e.g. "curvePoints"). */
  name: string;
  /** When provided, shows a hint if the curve doesn't yet reach 150% of this flow. */
  candidateRatedFlowGpm?: number;
}

/**
 * Shared repeatable (flow, pressure) curve-point list, used by both the curve validation and
 * power/driver-sizing forms. The 150%-of-rated-flow hint is client-side guidance only — the
 * backend resolver (PumpCurveInterpolator) is the actual source of truth and will reject a
 * curve that doesn't bracket it, regardless of what this hint says.
 */
export function PumpCurvePointsInput<T extends FieldValues>({
  control,
  register,
  watch,
  errors,
  name,
  candidateRatedFlowGpm,
}: PumpCurvePointsInputProps<T>) {
  const fieldArrayName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({ control, name: fieldArrayName });

  const currentPoints =
    (watch(name as Path<T>) as unknown as
      | { flowGpm?: string | number; pressurePsi?: string | number }[]
      | undefined) ?? [];
  const maxEnteredFlow = currentPoints.reduce((max, point) => {
    const value = Number(point.flowGpm);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  const requiredFlow =
    candidateRatedFlowGpm !== undefined && candidateRatedFlowGpm > 0 ? candidateRatedFlowGpm * 1.5 : undefined;
  const showHint = requiredFlow !== undefined && maxEnteredFlow < requiredFlow;

  const rowErrors = errors
    ? (errors as Record<string, unknown>)[name] as
        | { flowGpm?: { message?: string }; pressurePsi?: { message?: string } }[]
        | undefined
    : undefined;
  const listError = errors
    ? ((errors as Record<string, unknown>)[name] as { message?: string } | undefined)
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Curve Points</span>
        <button
          type="button"
          onClick={() => append({ flowGpm: "", pressurePsi: "" } as never)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add Point
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            {/* min-w-0 lets each field shrink below a number input's ~200px intrinsic width, so
                the row fits a phone screen instead of pushing the page wider. */}
            <div className="min-w-0 flex-1">
              <NumberField
                label={`Flow ${index + 1}`}
                unit="GPM"
                error={rowErrors?.[index]?.flowGpm?.message}
                {...register(`${name}.${index}.flowGpm` as Path<T>)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <NumberField
                label={`Pressure ${index + 1}`}
                unit="psi"
                error={rowErrors?.[index]?.pressurePsi?.message}
                {...register(`${name}.${index}.pressurePsi` as Path<T>)}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
              aria-label={`Remove point ${index + 1}`}
              className="mb-1 shrink-0 rounded-md border border-zinc-300 p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
        ))}
      </div>

      {listError?.message && <p className="text-xs text-red-600 dark:text-red-400">{listError.message}</p>}

      {requiredFlow !== undefined && (
        <p
          className={`text-xs ${
            showHint ? "text-amber-700 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Points should span from 0 GPM up through at least 150% of the rated flow (
          {requiredFlow.toFixed(0)} GPM).
          {showHint && " Current curve doesn't reach that yet."}
        </p>
      )}
    </div>
  );
}
