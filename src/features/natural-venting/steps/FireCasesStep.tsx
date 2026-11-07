"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { RadioGroupField } from "@/components/ui/RadioGroupField";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { useNaturalVentingReference } from "@/hooks/useNaturalVentingReference";
import { newFireCase } from "../defaults";
import { KIND_LABELS } from "../format";
import { QuickFillSelect } from "@/components/ui/QuickFillSelect";
import { commodityOptions, commodityValue } from "../referenceOptions";
import type { FireCaseFormInput } from "../schema";
import type { NaturalVentingForm, StepProps } from "../stepProps";
import { FIRE_CASE_KINDS } from "../types";

type FireNumberField = Exclude<
  keyof FireCaseFormInput,
  "key" | "name" | "zoneKey" | "kind" | "diameterSource" | "detectionSource"
>;

const DETECTION_OPTIONS = [
  { value: "known", label: "I know it (heat detectors to NFPA 72, DETACT, or another method)" },
  { value: "detector", label: "Smoke detectors: from the temperature rise at the detector (Equation 9.2.5.4.3)" },
];

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
    setValue,
    formState: { errors },
  } = form;
  const fireErrors = errors.fireCases?.[index];
  const kind = watch(`fireCases.${index}.kind`);
  const source = watch(`fireCases.${index}.diameterSource`);
  const detectionSource = watch(`fireCases.${index}.detectionSource`);
  const zones = watch("zones");
  const reference = useNaturalVentingReference();

  /** Puts a Table A.8.2.6 rate in the Q″ field; the field can still be typed over. */
  function fillUnitHeatReleaseRate(key: string) {
    const value = commodityValue(reference.commodities, key);
    if (value !== undefined) {
      setValue(`fireCases.${index}.unitHeatReleaseRate`, value, { shouldDirty: true, shouldValidate: true });
    }
  }

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
            <div className="flex flex-col gap-4 sm:col-span-2">
              <RadioGroupField
                legend="Detection time td"
                options={DETECTION_OPTIONS}
                hint="Time from ignition to detection, which the design interval is added to (8.3.5)."
                {...register(`fireCases.${index}.detectionSource`)}
              />
              {detectionSource === "known" && (
                <div className="grid items-end gap-4 sm:grid-cols-2">
                  <NumberField label="Detection time td" unit="s" {...number("detectionTime")} />
                </div>
              )}
              {detectionSource === "detector" && (
                <div className="grid items-end gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Distance from the fire axis to the detector r"
                    unit="m"
                    hint="The farthest distance possible from the detectors that control detection (9.2.5.4.2). For detectors on a square grid it is the spacing ÷ √2: Annex D uses 6.5 m for 9.1 m spacing."
                    {...number("detectorDistance")}
                  />
                  <NumberField
                    label="Temperature rise at activation ΔT"
                    unit="K"
                    hint="From tests of the detector and the fuel. Blank takes 20 K, the minimum where there are no test data (9.2.5.4.3.1 and 9.2.5.4.3.2)."
                    {...number("detectorTemperatureRise")}
                  />
                  <p className="text-xs text-zinc-500 sm:col-span-2 dark:text-zinc-400">
                    Uses tg above and the ceiling height above the base of the fire. The equation is for a
                    continuously growing fire. It is not DETACT-QS, so a time from that program can differ.
                  </p>
                </div>
              )}
            </div>
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
            <>
              <NumberField
                label="Heat release rate per unit area Q″"
                unit="kW/m²"
                hint="From test data or Table A.8.2.6. D = (4Q/πQ″)^½ (8.3.7)."
                {...number("unitHeatReleaseRate")}
              />
              <QuickFillSelect
                id={`fireCases-${index}-commodity-table`}
                label="Fill Q″ from Table A.8.2.6"
                hint="The rate is for the stack height named. A rate for another height can be taken as proportional to height (A.8.2.6)."
                placeholder="Choose a commodity…"
                options={commodityOptions(reference.commodities)}
                loading={reference.isLoading}
                failed={reference.error !== null}
                onPick={fillUnitHeatReleaseRate}
              />
            </>
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
