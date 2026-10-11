"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import type { FittingEquivalentLengthTableRow } from "./types";
import { UNITS } from "./labels";
import { publishedFittingLength } from "./request";
import { RowCard, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";

interface SegmentFittingsInputProps {
  form: SprinklerForm;
  segmentIndex: number;
  fittings: FittingEquivalentLengthTableRow[];
}

/**
 * Fittings on one pipe segment. The equivalent length comes from NFPA 13's published chart when it
 * has a value for this fitting at this pipe size; where it doesn't — the chart leaves plenty of
 * combinations blank — the field for an explicit length appears instead, since the API rejects a
 * fitting it can't resolve.
 *
 * The two paths behave differently downstream, so they say so: a chart lookup is rescaled for the
 * segment's C factor by the calculation, while a length typed in here is used exactly as entered.
 */
export function SegmentFittingsInput({ form, segmentIndex, fittings }: SegmentFittingsInputProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: `segments.${segmentIndex}.fittings`,
  });
  const nominalSize = watch(`segments.${segmentIndex}.nominalSize`);

  const typeOptions: SelectOption[] = [
    { value: "", label: "Not specified" },
    ...fittings.map((row) => ({ value: row.fittingType, label: row.label })),
  ];

  return (
    <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/60">
      <RowList
        itemLabel="fitting"
        count={fields.length}
        onAdd={() => append({ fittingType: "", quantity: 1, explicitEquivalentLengthFt: "" })}
      >
        {fields.map((field, index) => {
          const rowErrors = errors.segments?.[segmentIndex]?.fittings?.[index];
          const fittingType = watch(`segments.${segmentIndex}.fittings.${index}.fittingType`);
          const published = publishedFittingLength(fittingType, nominalSize, fittings);

          return (
            <RowCard
              key={field.id}
              title={`Fitting ${index + 1}`}
              describedAs={`fitting ${index + 1} on segment ${segmentIndex + 1}`}
              onDuplicate={() =>
                insert(index + 1, { ...watch(`segments.${segmentIndex}.fittings.${index}`) })
              }
              onRemove={() => remove(index)}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Fitting type"
                  options={typeOptions}
                  error={rowErrors?.fittingType?.message}
                  {...register(`segments.${segmentIndex}.fittings.${index}.fittingType`)}
                />
                <NumberField
                  label="Quantity"
                  error={rowErrors?.quantity?.message}
                  {...register(`segments.${segmentIndex}.fittings.${index}.quantity`)}
                />
              </div>

              {published === undefined ? (
                <NumberField
                  label="Equivalent length (each)"
                  unit={UNITS.length}
                  hint={
                    fittingType
                      ? "NFPA 13's chart publishes no length for this fitting at this pipe size — enter the value from the manufacturer or the standard. It is used exactly as entered, with no C factor rescaling, so give the length for this segment's pipe."
                      : "Enter the equivalent length, or choose a fitting type above. A length entered here is used exactly as given, with no C factor rescaling."
                  }
                  error={rowErrors?.explicitEquivalentLengthFt?.message}
                  {...register(`segments.${segmentIndex}.fittings.${index}.explicitEquivalentLengthFt`)}
                />
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Published equivalent length: {published} {UNITS.length} each, in feet of
                  C&nbsp;=&nbsp;120 pipe (NFPA 13 Table 27.2.3.1.1). The calculation rescales it
                  for this segment&apos;s C factor and reports the factor it used in the worksheet.
                </p>
              )}
            </RowCard>
          );
        })}
      </RowList>
    </div>
  );
}
