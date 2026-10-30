"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { newFireCase } from "../defaults";
import { KIND_LABELS } from "../format";
import type { FireCaseFormInput } from "../schema";
import type { NaturalVentingForm, StepProps } from "../stepProps";
import { FIRE_CASE_KINDS } from "../types";

type FireNumberField = Exclude<
  keyof FireCaseFormInput,
  "key" | "name" | "zoneKey" | "kind" | "diameterSource"
>;

const KIND_OPTIONS = FIRE_CASE_KINDS.map((value) => ({ value, label: KIND_LABELS[value] }));

const DIAMETER_OPTIONS = [
  { value: "unitHrr", label: "From a heat release rate per unit floor area" },
  { value: "area", label: "From the floor area of the fuel" },
  { value: "diameter", label: "I know the diameter" },
];

/**
 * Step 3: the design fires. Each is placed in one curtained area and evaluated at one design
 * smoke layer height, so a fire at several layer heights is several fire cases.
 */
export function FireCasesStep({ form }: StepProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "fireCases", keyName: "rowId" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length} fire {fields.length === 1 ? "case" : "cases"}
        </span>
        <button
          type="button"
          onClick={() =>
            append(newFireCase(getValues("fireCases"), getValues("zones")[0]?.key ?? ""))
          }
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add fire case
        </button>
      </div>
      {errors.fireCases?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.fireCases.message}</p>
      )}

      {fields.map((field, index) => (
        <FireCaseCard
          key={field.rowId}
          form={form}
          index={index}
          onRemove={() => remove(index)}
          removeDisabled={fields.length === 1}
        />
      ))}
    </div>
  );
}

interface FireCaseCardProps {
  form: NaturalVentingForm;
  index: number;
  onRemove: () => void;
  removeDisabled: boolean;
}

function FireCaseCard({ form, index, onRemove, removeDisabled }: FireCaseCardProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const fireErrors = errors.fireCases?.[index];
  const kind = watch(`fireCases.${index}.kind`);
  const source = watch(`fireCases.${index}.diameterSource`);
  const zones = watch("zones");

  const number = (name: FireNumberField) => ({
    ...register(`fireCases.${index}.${name}` as const),
    error: fireErrors?.[name]?.message as string | undefined,
  });

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            error={fireErrors?.name?.message}
            {...register(`fireCases.${index}.name`)}
          />
          <SelectField
            label="Curtained area"
            options={zones.map((zone) => ({ value: zone.key, label: zone.name || zone.key }))}
            error={fireErrors?.zoneKey?.message}
            {...register(`fireCases.${index}.zoneKey`)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          className="self-start rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Remove
        </button>
      </div>

      <RadioGroupField
        legend="Heat release rate"
        options={KIND_OPTIONS}
        hint="A growing fire is taken at the end of the design interval: Q = c((tr + td)/tg)² (8.3.5)."
        {...register(`fireCases.${index}.kind`)}
      />

      <div className="grid items-end gap-4 sm:grid-cols-2">
        {kind === "STEADY" ? (
          <NumberField
            label="Heat release rate Q"
            unit="kW"
            hint="Maximum anticipated, from tests or Annex E."
            {...number("steadyHeatReleaseRate")}
          />
        ) : (
          <>
            <NumberField
              label="Growth time tg"
              unit="s"
              hint="Time to reach 1055 kW."
              {...number("growthTime")}
            />
            <NumberField
              label="Detection time td"
              unit="s"
              hint="Time from ignition to detection."
              {...number("detectionTime")}
            />
            <NumberField
              label="Design interval tr"
              unit="s"
              hint="Measured from detection (3.3.8): the time the layer must be held."
              {...number("designInterval")}
            />
            <NumberField
              label="Fuel-limited maximum"
              unit="kW"
              hint="Optional. Caps the fire at what the fuel can supply."
              {...number("maxHeatReleaseRate")}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <RadioGroupField
          legend="Size of the fire"
          options={DIAMETER_OPTIONS}
          hint="The diameter is that of a circle with the area of the fuel (8.2.4)."
          {...register(`fireCases.${index}.diameterSource`)}
        />
        <div className="grid items-end gap-4 sm:grid-cols-2">
          {source === "unitHrr" && (
            <NumberField
              label="Heat release rate per unit area Q″"
              unit="kW/m²"
              hint="From test data or Table A.8.2.6. D = (4Q/πQ″)^½ (8.3.7)."
              {...number("unitHeatReleaseRate")}
            />
          )}
          {source === "area" && (
            <NumberField label="Floor area of the fuel" unit="m²" {...number("fireArea")} />
          )}
          {source === "diameter" && (
            <NumberField label="Fire diameter D" unit="m" {...number("fireDiameter")} />
          )}
          <NumberField
            label="Largest fire dimension Wf"
            unit="m"
            hint="Only for a long, narrow line-like fire (9.2.3.4)."
            {...number("largestFireDimension")}
          />
        </div>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <NumberField
          label="Base of the fire above the floor"
          unit="m"
          hint="Blank means at floor level."
          {...number("fireBaseHeight")}
        />
        <NumberField
          label="Design smoke layer height"
          unit="m"
          hint="Of the layer boundary above the floor, at the end of the design interval."
          {...number("smokeLayerHeight")}
        />
      </div>
    </section>
  );
}
