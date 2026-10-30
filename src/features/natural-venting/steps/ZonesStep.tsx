"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { TextField } from "@/components/ui/TextField";
import { newZone } from "../defaults";
import { DISCHARGE_COEFFICIENT_HINT } from "../labels";
import type { ZoneFormInput } from "../schema";
import type { NaturalVentingForm, StepProps } from "../stepProps";

type ZoneNumberField = Exclude<keyof ZoneFormInput, "key" | "name" | "inletMode">;

const INLET_OPTIONS = [
  { value: "ratio", label: "Size the inlets as a multiple of the vent area" },
  { value: "area", label: "I have a net inlet area" },
  { value: "none", label: "Leave the inlets out for now" },
];

/**
 * Step 2: the curtained areas. Each is a smoke reservoir with its height, the vents and inlets
 * provided, and the design objectives. Everything after the first group is optional: the checks
 * that need it say OPEN until it is given.
 */
export function ZonesStep({ form }: StepProps) {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "zones", keyName: "rowId" });

  function removeZone(index: number) {
    const removed = getValues(`zones.${index}.key`);
    const remaining = getValues("zones").filter((_, i) => i !== index);
    // A fire case can't stay in a zone that is gone: it moves to the first one left.
    getValues("fireCases").forEach((fire, fireIndex) => {
      if (fire.zoneKey === removed) {
        setValue(`fireCases.${fireIndex}.zoneKey`, remaining[0].key, { shouldValidate: true });
      }
    });
    remove(index);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {fields.length} curtained {fields.length === 1 ? "area" : "areas"}
        </span>
        <button
          type="button"
          onClick={() => append(newZone(getValues("zones")))}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add curtained area
        </button>
      </div>
      {errors.zones?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.zones.message}</p>
      )}
      {errors.zones?.root?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.zones.root.message}</p>
      )}

      {fields.map((field, index) => (
        <ZoneCard
          key={field.rowId}
          form={form}
          index={index}
          onRemove={() => removeZone(index)}
          removeDisabled={fields.length === 1}
        />
      ))}
    </div>
  );
}

interface ZoneCardProps {
  form: NaturalVentingForm;
  index: number;
  onRemove: () => void;
  removeDisabled: boolean;
}

function ZoneCard({ form, index, onRemove, removeDisabled }: ZoneCardProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const zoneErrors = errors.zones?.[index];
  const inletMode = watch(`zones.${index}.inletMode`);

  const number = (name: ZoneNumberField) => ({
    ...register(`zones.${index}.${name}` as const),
    error: zoneErrors?.[name]?.message as string | undefined,
  });

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            label="Name"
            error={zoneErrors?.name?.message}
            {...register(`zones.${index}.name`)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Remove
        </button>
      </div>

      <Group title="Reservoir">
        <NumberField
          label="Ceiling height H"
          unit="m"
          hint="Floor to ceiling (7.3.1)."
          {...number("ceilingHeight")}
        />
        <NumberField
          label="Height to the middle of the vents"
          unit="m"
          hint="Above the floor. Blank takes the ceiling. The smoke layer depth d runs from the layer boundary to here."
          {...number("ventCentreHeight")}
        />
        <NumberField
          label="Draft curtain depth"
          unit="m"
          hint="At least 20 % of H (7.3.1)."
          {...number("curtainDepth")}
        />
        <NumberField label="Length of the curtained area" unit="m" {...number("zoneLength")} />
        <NumberField
          label="Width of the curtained area"
          unit="m"
          hint="Neither may exceed 8H (7.4.1)."
          {...number("zoneWidth")}
        />
      </Group>

      <Group title="Vents">
        <NumberField
          label="Vent discharge coefficient Cd,v"
          tooltip={DISCHARGE_COEFFICIENT_HINT}
          {...number("ventDischargeCoefficient")}
        />
        <NumberField label="Number of vents" {...number("ventCount")} />
        <NumberField
          label="Total vent area provided"
          unit="m²"
          hint="Geometric area. Compared with the area required."
          {...number("ventTotalArea")}
        />
        <NumberField
          label="Length of one vent"
          unit="m"
          hint="With the width, for the 2d² limit (5.4.1.1). Blank uses total area ÷ number."
          {...number("ventUnitLength")}
        />
        <NumberField label="Width of one vent" unit="m" {...number("ventUnitWidth")} />
        <NumberField
          label="Largest vent spacing S"
          unit="m"
          hint="Centre to centre, at most 4H (5.4.2)."
          {...number("ventSpacing")}
        />
        <NumberField
          label="Largest distance from a wall or curtain to a vent"
          unit="m"
          hint="At most 2.8H (5.4.3)."
          {...number("ventToWallDistance")}
        />
      </Group>

      <Group title="Make-up air inlets">
        <div className="sm:col-span-2">
          <RadioGroupField
            legend="How the inlets are given"
            options={INLET_OPTIONS}
            hint="The inlet takes part in the vent flow (Equation 9.2.4.1), so the vent area depends on it."
            {...register(`zones.${index}.inletMode`)}
          />
        </div>
        {inletMode === "ratio" && (
          <NumberField
            label="Inlet area ÷ vent area"
            hint="Annex D uses 1.5."
            {...number("inletAreaRatio")}
          />
        )}
        {inletMode === "area" && (
          <NumberField
            label="Net inlet area"
            unit="m²"
            hint="Free area. Also gives the air velocity (6.6.3)."
            {...number("inletNetArea")}
          />
        )}
        <NumberField
          label="Inlet discharge coefficient Cd,i"
          hint="Blank takes the vent's."
          {...number("inletDischargeCoefficient")}
        />
      </Group>

      <Group title="Design objectives and other limits">
        <NumberField
          label="Maximum layer temperature rise"
          unit="K"
          hint="Clause 4.1 requires an objective. Annex D limits the floor heat flux to 2.5 kW/m², a rise of 164 K."
          {...number("maxLayerTemperatureRise")}
        />
        <NumberField
          label="Maximum radiant flux at the floor"
          unit="kW/m²"
          hint="Annex D objective, not a requirement of NFPA 204."
          {...number("maxFloorRadiantFlux")}
        />
        <NumberField
          label="Aisle width between fuel arrays"
          unit="m"
          hint="For steady fires: at least 0.042 Q^½ (8.2.3)."
          {...number("aisleWidth")}
        />
      </Group>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</legend>
      <div className="grid items-end gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
