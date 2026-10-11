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
 * Fittings on one pipe segment. The equivalent length comes from the published table when it has
 * a value for this fitting at this pipe size; where it doesn't, the field for an explicit length
 * appears instead — the API rejects a fitting it can't resolve, so asking here is the only way the
 * request can succeed. (At the moment no fitting publishes lengths, so the field always shows.)
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
                      ? "No published equivalent length for this fitting at this pipe size — enter the value from the manufacturer or the standard."
                      : "Enter the equivalent length, or choose a fitting type above."
                  }
                  error={rowErrors?.explicitEquivalentLengthFt?.message}
                  {...register(`segments.${segmentIndex}.fittings.${index}.explicitEquivalentLengthFt`)}
                />
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Published equivalent length: {published} {UNITS.length} each.
                </p>
              )}
            </RowCard>
          );
        })}
      </RowList>
    </div>
  );
}
