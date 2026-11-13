"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { newFitting } from "../../defaults";
import { EXPLICIT_FITTING } from "../../schema";
import type { StandpipeForm, StepProps } from "../../stepProps";

/**
 * Where a run of pipe and its fittings live in the form: a segment of the main path, or the pipe of
 * a fire department connection. Both have the same fields, so one editor serves both; the paths
 * are cast to the segment form because react-hook-form types them per array.
 */
export type PipeBase = `segments.${number}` | `fireDepartmentConnections.${number}`;
export type FittingErrors = FittingRowProps["error"][] | undefined;

export function FittingsEditor({
  form,
  base,
  fittings,
  fittingErrors,
}: {
  form: StandpipeForm;
  base: PipeBase;
  fittings: StepProps["fittings"];
  fittingErrors: FittingErrors;
}) {
  const { control, register, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${base}.fittings` as `segments.${number}.fittings`,
    keyName: "rowId",
  });
  const nominalSize = watch(`${base}.nominalSize` as `segments.${number}.nominalSize`);

  const options: SelectOption[] = [
    { value: "", label: "Choose…" },
    ...fittings.map((fitting) => ({
      value: fitting.fittingType,
      label:
        nominalSize !== "" && fitting.equivalentLengthFtByNominalSize[nominalSize] === undefined
          ? `${fitting.label} (not published at this size)`
          : fitting.label,
      disabled:
        nominalSize !== "" && fitting.equivalentLengthFtByNominalSize[nominalSize] === undefined,
    })),
    { value: EXPLICIT_FITTING, label: "Other: enter an equivalent length" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Fittings and valves
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {fields.length === 0 ? "none" : `${fields.length} line${fields.length === 1 ? "" : "s"}`}
          </span>
        </span>
        <button
          type="button"
          onClick={() => append(newFitting())}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add fitting
        </button>
      </div>
      {fields.map((field, fittingIndex) => (
        <FittingRow
          key={field.rowId}
          form={form}
          base={base}
          fittingIndex={fittingIndex}
          options={options}
          error={fittingErrors?.[fittingIndex]}
          register={register}
          onRemove={() => remove(fittingIndex)}
        />
      ))}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Equivalent lengths come from the chart the API serves and are adjusted for the pipe&apos;s C
        factor and inside diameter. Include the hose valve here: its loss belongs in the calculation.
      </p>
    </div>
  );
}

interface FittingRowProps {
  form: StandpipeForm;
  base: PipeBase;
  fittingIndex: number;
  options: SelectOption[];
  error?: {
    fittingType?: { message?: string };
    quantity?: { message?: string };
    explicitEquivalentLengthFt?: { message?: string };
  };
  register: StandpipeForm["register"];
  onRemove: () => void;
}

function FittingRow({ form, base: pipeBase, fittingIndex, options, error, register, onRemove }: FittingRowProps) {
  const base = `${pipeBase}.fittings.${fittingIndex}` as `segments.${number}.fittings.${number}`;
  const type = form.watch(`${base}.fittingType`);

  return (
    <div className="grid items-end gap-3 rounded-md border border-zinc-200 p-3 sm:grid-cols-[minmax(0,2fr)_6rem_minmax(0,1fr)_auto] dark:border-zinc-800">
      <SelectField
        label="Fitting"
        options={options}
        error={error?.fittingType?.message}
        {...register(`${base}.fittingType`)}
      />
      <NumberField label="Quantity" error={error?.quantity?.message} {...register(`${base}.quantity`)} />
      {type === EXPLICIT_FITTING ? (
        <NumberField
          label="Length each"
          unit="ft"
          error={error?.explicitEquivalentLengthFt?.message}
          {...register(`${base}.explicitEquivalentLengthFt`)}
        />
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="self-end rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Remove
      </button>
    </div>
  );
}
