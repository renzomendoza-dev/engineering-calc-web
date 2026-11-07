"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { newFdcLine, newFitting, newSegment } from "../defaults";
import { CONNECTION_LABELS, ROLE_LABELS } from "../labels";
import { materialOptions, scheduleOptions, sizeOptions } from "../pipeOptions";
import { EXPLICIT_FITTING, type SegmentFormInput } from "../schema";
import type { StandpipeForm, StepProps } from "../stepProps";
import { HOSE_CONNECTION_SIZES, PIPE_ROLES } from "../types";

type SegmentNumberField = Extract<
  keyof SegmentFormInput,
  "flowAddedGpm" | "cFactor" | "pipeLengthFt" | "elevationRiseFt"
>;

const ROLE_OPTIONS = PIPE_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }));
const CONNECTION_OPTIONS = [
  { value: "", label: "None" },
  ...HOSE_CONNECTION_SIZES.map((value) => ({ value, label: CONNECTION_LABELS[value] })),
];

const C_FACTOR_HINT =
  "Hazen-Williams C. 120 is black steel in wet service in the C table of NFPA 14 (Table 11.3.2.3); other pipe types are listed at the foot of the page. The AHJ may require another value.";

/**
 * Step 2: the pipe path from the hydraulically most remote hose connection back to the supply, one
 * row per run of pipe, remote end first, like the rows of a hydraulic calculation sheet.
 */
export function PathStep({ form, materials, materialsLoading, fittings, cFactors, referenceEdition }: StepProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: "segments", keyName: "rowId" });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Start at the hose connection that is hardest to reach and work back to the supply. A hose
        connection&apos;s outlet is held at the residual pressure the standard requires; pressure
        then builds up along the path.
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length} {fields.length === 1 ? "segment" : "segments"}
        </span>
        <button
          type="button"
          onClick={() => append(newSegment(getValues("segments")))}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add segment
        </button>
      </div>
      {errors.segments?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.segments.message}</p>
      )}
      {errors.segments?.root?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.segments.root.message}</p>
      )}

      {fields.map((field, index) => (
        <SegmentCard
          key={field.rowId}
          form={form}
          index={index}
          last={index === fields.length - 1}
          materials={materials}
          materialsLoading={materialsLoading}
          fittings={fittings}
          onRemove={() => remove(index)}
          onMove={(by) => move(index, index + by)}
          removeDisabled={fields.length === 1}
        />
      ))}

      <FdcSection form={form} materials={materials} materialsLoading={materialsLoading} fittings={fittings} />

      {cFactors.length > 0 && (
        <details className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
            Hazen-Williams C values ({referenceEdition})
          </summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
            {cFactors.map((entry) => (
              <li key={entry.pipeType} className="flex justify-between gap-4">
                <span>{entry.label}</span>
                <span className="tabular-nums">{entry.cFactor}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

type FdcSectionProps = Pick<StepProps, "form" | "materials" | "materialsLoading" | "fittings">;

/**
 * The piping of each fire department connection, from the system out to the connection. Class I
 * and III systems are to be designed so each connection can supply the system demand (10.4.1), and
 * the calculations should show it (A.10.4.1): each connection's pipes carry the flow at the supply,
 * and the pressure the fire department must deliver there is found. Left empty, the result says so.
 */
function FdcSection({ form, materials, materialsLoading, fittings }: FdcSectionProps) {
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

interface SegmentCardProps {
  form: StandpipeForm;
  index: number;
  last: boolean;
  materials: StepProps["materials"];
  materialsLoading: boolean;
  fittings: StepProps["fittings"];
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
  removeDisabled: boolean;
}

function SegmentCard({
  form,
  index,
  last,
  materials,
  materialsLoading,
  fittings,
  onRemove,
  onMove,
  removeDisabled,
}: SegmentCardProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const segmentErrors = errors.segments?.[index];
  const material = watch(`segments.${index}.pipeMaterial`);
  const schedule = watch(`segments.${index}.schedule`);
  const connection = watch(`segments.${index}.hoseConnectionSize`);
  const hasConnection = connection !== "";

  const number = (name: SegmentNumberField) => ({
    ...register(`segments.${index}.${name}` as const),
    error: segmentErrors?.[name]?.message as string | undefined,
  });

  const schedules = scheduleOptions(materials, material);
  const sizes: SelectOption[] = [
    { value: "", label: materialsLoading ? "Loading…" : "Choose…" },
    ...sizeOptions(materials, material, schedule),
  ];

  const materialRegistration = register(`segments.${index}.pipeMaterial`, {
    onChange: (event) => {
      // A new material has its own schedules and sizes: start from its first schedule, and ask for
      // the size again rather than carrying one over that may not exist.
      const next = scheduleOptions(materials, event.target.value)[0]?.value ?? "";
      setValue(`segments.${index}.schedule`, next, { shouldValidate: true });
      setValue(`segments.${index}.nominalSize`, "", { shouldValidate: true });
    },
  });

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 items-end gap-4 sm:grid-cols-2">
          <TextField
            label={`${index + 1}. Name`}
            hint={index === 0 ? "The most remote end of the path." : undefined}
            error={segmentErrors?.label?.message}
            {...register(`segments.${index}.label`)}
          />
          <SelectField
            label="What the pipe is"
            options={ROLE_OPTIONS}
            hint="Sets the minimum size that applies."
            {...register(`segments.${index}.role`)}
          />
        </div>
        <div className="flex gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move segment ${index + 1} up`}
            className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={last}
            aria-label={`Move segment ${index + 1} down`}
            className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={removeDisabled}
            className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <SelectField
          label="Hose connection at the remote end"
          options={CONNECTION_OPTIONS}
          hint="Choose one where a hose connection discharges here."
          error={segmentErrors?.hoseConnectionSize?.message}
          {...register(`segments.${index}.hoseConnectionSize`)}
        />
        <NumberField
          label={hasConnection ? "Hose connection flow" : "Other flow joining here"}
          unit="gpm"
          hint={hasConnection ? undefined : "Optional."}
          {...number("flowAddedGpm")}
        />
        {!hasConnection && (
          <label className="flex items-start gap-2 text-sm text-zinc-700 sm:col-span-2 dark:text-zinc-300">
            <input type="checkbox" className="mt-1" {...register(`segments.${index}.otherStandpipeConnection`)} />
            <span>
              The flow joining here is another standpipe&apos;s, at its connection point to the common supply
              piping
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                The pressure there is held at the minimum residual, 100 psi, and its flow is not balanced to
                a higher pressure (10.6.1.2.1, 10.6.1.2.4). Flow of other standpipes left off the path joins
                at the supply end instead.
              </span>
            </span>
          </label>
        )}
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <SelectField
          label="Pipe material"
          options={materialOptions(materials)}
          error={segmentErrors?.pipeMaterial?.message}
          {...materialRegistration}
        />
        <SelectField
          label="Schedule"
          options={schedules}
          error={segmentErrors?.schedule?.message}
          {...register(`segments.${index}.schedule`, {
            onChange: () => setValue(`segments.${index}.nominalSize`, "", { shouldValidate: true }),
          })}
        />
        <SelectField
          label="Nominal size"
          options={sizes}
          error={segmentErrors?.nominalSize?.message}
          {...register(`segments.${index}.nominalSize`)}
        />
        <NumberField label="C factor" tooltip={C_FACTOR_HINT} {...number("cFactor")} />
        <NumberField label="Pipe length" unit="ft" {...number("pipeLengthFt")} />
        <NumberField
          label="Rise toward the remote end"
          unit="ft"
          hint="How much higher the remote end is than the supply end. A riser is positive."
          {...number("elevationRiseFt")}
        />
      </div>

      <FittingsEditor
        form={form}
        base={`segments.${index}`}
        fittings={fittings}
        fittingErrors={segmentErrors?.fittings as unknown as FittingErrors}
      />
    </section>
  );
}

/**
 * Where a run of pipe and its fittings live in the form: a segment of the main path, or the pipe of
 * a fire department connection. Both have the same fields, so one editor serves both; the paths
 * are cast to the segment form because react-hook-form types them per array.
 */
type PipeBase = `segments.${number}` | `fireDepartmentConnections.${number}`;
type FittingErrors = FittingRowProps["error"][] | undefined;

function FittingsEditor({
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
