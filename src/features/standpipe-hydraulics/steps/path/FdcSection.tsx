"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { materialOptions, scheduleOptions, sizeOptions } from "@/features/pipe-velocity/pipeOptions";
import { newFdcLine } from "../../defaults";
import { C_FACTOR_HINT } from "../../labels";
import type { StepProps } from "../../stepProps";
import { FittingsEditor, type FittingErrors } from "./FittingsEditor";

type FdcSectionProps = Pick<StepProps, "form" | "materials" | "materialsLoading" | "fittings">;

/**
 * The piping of each fire department connection, from the system out to the connection. Class I
 * and III systems are to be designed so each connection can supply the system demand (10.4.1), and
 * the calculations should show it (A.10.4.1): each connection's pipes carry the flow at the supply,
 * and the pressure the fire department must deliver there is found. Left empty, the result says so.
 */
export function FdcSection({ form, materials, materialsLoading, fittings }: FdcSectionProps) {
  const {
    control,
    getValues,
    watch,
    formState: { errors },
  } = form;
  const standpipeClass = watch("standpipeClass");
  const { fields, append, remove } = useFieldArray({ control, name: "fireDepartmentConnections", keyName: "rowId" });

  if (standpipeClass === "CLASS_II") return null;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fire department connections</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Each connection must be able to supply the system demand (10.4.1). Give the pipe from the base of
          the system out to each connection to find the pressure the fire department must deliver there. The
          flow it carries is the whole flow at the supply, unless you give a share because several connections
          carry the demand together (10.7.3.2).
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length === 0 ? "none given" : `${fields.length} ${fields.length === 1 ? "connection" : "connections"}`}
        </span>
        <button
          type="button"
          onClick={() => append(newFdcLine(getValues("fireDepartmentConnections")))}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add fire department connection
        </button>
      </div>
      {errors.fireDepartmentConnections?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.fireDepartmentConnections.message}</p>
      )}
      {fields.map((field, index) => (
        <FdcCard
          key={field.rowId}
          form={form}
          index={index}
          materials={materials}
          materialsLoading={materialsLoading}
          fittings={fittings}
          onRemove={() => remove(index)}
        />
      ))}
    </section>
  );
}

type FdcNumberField = "flowGpm" | "inlets" | "cFactor" | "pipeLengthFt" | "elevationRiseFt";

function FdcCard({
  form,
  index,
  materials,
  materialsLoading,
  fittings,
  onRemove,
}: FdcSectionProps & { index: number; onRemove: () => void }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const connectionErrors = errors.fireDepartmentConnections?.[index];
  const material = watch(`fireDepartmentConnections.${index}.pipeMaterial`);
  const schedule = watch(`fireDepartmentConnections.${index}.schedule`);

  const number = (name: FdcNumberField) => ({
    ...register(`fireDepartmentConnections.${index}.${name}` as const),
    error: connectionErrors?.[name]?.message as string | undefined,
  });

  const schedules = scheduleOptions(materials, material);
  const sizes: SelectOption[] = [
    { value: "", label: materialsLoading ? "Loading…" : "Choose…" },
    ...sizeOptions(materials, material, schedule),
  ];

  const materialRegistration = register(`fireDepartmentConnections.${index}.pipeMaterial`, {
    onChange: (event) => {
      const next = scheduleOptions(materials, event.target.value)[0]?.value ?? "";
      setValue(`fireDepartmentConnections.${index}.schedule`, next, { shouldValidate: true });
      setValue(`fireDepartmentConnections.${index}.nominalSize`, "", { shouldValidate: true });
    },
  });

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 items-end gap-4 sm:grid-cols-2">
          <TextField
            label={`${index + 1}. Name`}
            hint="For example the street side."
            error={connectionErrors?.label?.message}
            {...register(`fireDepartmentConnections.${index}.label`)}
          />
          <NumberField
            label="Flow carried"
            unit="gpm"
            hint="Blank: the whole flow at the supply."
            {...number("flowGpm")}
          />
          <NumberField
            label="Inlets on this connection"
            hint="Optional. Checked against the flow carried (10.7.3)."
            {...number("inlets")}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="self-start rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 sm:self-auto dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Remove
        </button>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <SelectField
          label="Pipe material"
          options={materialOptions(materials)}
          error={connectionErrors?.pipeMaterial?.message}
          {...materialRegistration}
        />
        <SelectField
          label="Schedule"
          options={schedules}
          error={connectionErrors?.schedule?.message}
          {...register(`fireDepartmentConnections.${index}.schedule`, {
            onChange: () => setValue(`fireDepartmentConnections.${index}.nominalSize`, "", { shouldValidate: true }),
          })}
        />
        <SelectField
          label="Nominal size"
          options={sizes}
          error={connectionErrors?.nominalSize?.message}
          {...register(`fireDepartmentConnections.${index}.nominalSize`)}
        />
        <NumberField label="C factor" tooltip={C_FACTOR_HINT} {...number("cFactor")} />
        <NumberField label="Pipe length" unit="ft" {...number("pipeLengthFt")} />
        <NumberField
          label="Rise toward the system end"
          unit="ft"
          hint="How much higher the system end is than the connection. Positive where the connection is lower."
          {...number("elevationRiseFt")}
        />
      </div>

      <FittingsEditor
        form={form}
        base={`fireDepartmentConnections.${index}`}
        fittings={fittings}
        fittingErrors={connectionErrors?.fittings as unknown as FittingErrors}
      />
    </div>
  );
}
