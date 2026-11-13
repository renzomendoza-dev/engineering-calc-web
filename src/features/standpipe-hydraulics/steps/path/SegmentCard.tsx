"use client";

import { NumberField } from "@/components/ui/NumberField";
import { QuickFillSelect } from "@/components/ui/QuickFillSelect";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { materialOptions, scheduleOptions, sizeOptions } from "@/features/pipe-velocity/pipeOptions";
import { hoseNozzleOptions, hoseNozzleValue } from "../../hoseNozzleOptions";
import { C_FACTOR_HINT, CONNECTION_LABELS, ROLE_LABELS } from "../../labels";
import type { SegmentFormInput } from "../../schema";
import type { StandpipeForm, StepProps } from "../../stepProps";
import { HOSE_CONNECTION_SIZES, PIPE_ROLES } from "../../types";
import { FittingsEditor, type FittingErrors } from "./FittingsEditor";

type SegmentNumberField = Extract<
  keyof SegmentFormInput,
  "flowAddedGpm" | "designResidualPressurePsi" | "cFactor" | "pipeLengthFt" | "elevationRiseFt"
>;

const ROLE_OPTIONS = PIPE_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }));
const CONNECTION_OPTIONS = [
  { value: "", label: "None" },
  ...HOSE_CONNECTION_SIZES.map((value) => ({ value, label: CONNECTION_LABELS[value] })),
];

interface SegmentCardProps {
  form: StandpipeForm;
  index: number;
  last: boolean;
  materials: StepProps["materials"];
  materialsLoading: boolean;
  fittings: StepProps["fittings"];
  hoseNozzles: StepProps["hoseNozzles"];
  referenceLoading: boolean;
  referenceFailed: boolean;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
  removeDisabled: boolean;
}

export function SegmentCard({
  form,
  index,
  last,
  materials,
  materialsLoading,
  fittings,
  hoseNozzles,
  referenceLoading,
  referenceFailed,
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
        {hasConnection && (
          <>
            <QuickFillSelect
              id={`segments-${index}-hose-nozzle`}
              label="Fire department hose and nozzle"
              hint="Fills the pressure beside it from Table A.10.2.6. Friction loss varies with the hose, and the fire department should flow test its own choice (A.10.2.6)."
              placeholder="Choose one to fill the pressure…"
              options={hoseNozzleOptions(hoseNozzles)}
              loading={referenceLoading}
              failed={referenceFailed}
              onPick={(key) => {
                const pressure = hoseNozzleValue(hoseNozzles, key);
                if (pressure !== undefined) {
                  setValue(`segments.${index}.designResidualPressurePsi`, pressure, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
            <NumberField
              label="Design residual pressure at the outlet"
              unit="psi"
              hint="Optional. Blank holds the outlet at the minimum for its size (10.2.6.1). A higher figure holds it there, for example what the fire department's hose and nozzle need. A figure below the minimum changes nothing."
              {...number("designResidualPressurePsi")}
            />
          </>
        )}
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
