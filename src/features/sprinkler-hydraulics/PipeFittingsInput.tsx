"use client";

import { get, useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { UNITS } from "./labels";
import { publishedFittingLength } from "./request";
import { RowCard, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow } from "./types";

/**
 * react-hook-form types its paths from the form's shape, and this component is handed a path at
 * run time -- any pipe in the network. These aliases give it one concrete shape to type against;
 * the string cast at each use is the honest part: the runtime path is whichever pipe this is.
 */
type FittingsArrayPath = `network.riser.${number}.fittings`;
type FittingFieldPath<K extends string> = `network.riser.${number}.fittings.${number}.${K}`;
type NominalSizePath = `network.riser.${number}.nominalSize`;

interface PipeFittingsInputProps {
  form: SprinklerForm;
  /** Where this pipe lives in the form, e.g. "network.branches.0.sprinklers.2.pipe". */
  basePath: string;
  fittings: FittingEquivalentLengthTableRow[];
  /** Names the pipe in the buttons' accessible labels, e.g. "branch 1, sprinkler 2". */
  describedAs: string;
}

/**
 * Fittings on one pipe. The equivalent length comes from NFPA 13's published chart when it has a
 * value for this fitting at this pipe size; where it doesn't -- the chart leaves plenty of
 * combinations blank -- the field for an explicit length appears instead, since the API rejects a
 * fitting it can't resolve.
 *
 * The two paths behave differently downstream, so they say so: a chart lookup is rescaled for the
 * pipe's C factor by the calculation, while a length typed in here is used exactly as entered.
 */
export function PipeFittingsInput({ form, basePath, fittings, describedAs }: PipeFittingsInputProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const arrayPath = `${basePath}.fittings` as FittingsArrayPath;
  const { fields, append, remove, insert } = useFieldArray({ control, name: arrayPath });
  const nominalSize = watch(`${basePath}.nominalSize` as NominalSizePath);

  const typeOptions: SelectOption[] = [
    { value: "", label: "Not specified" },
    ...fittings.map((row) => ({ value: row.fittingType, label: row.label })),
  ];

  const field = <K extends string>(index: number, key: K) =>
    `${basePath}.fittings.${index}.${key}` as FittingFieldPath<K>;

  return (
    <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/60">
      <RowList
        itemLabel="fitting"
        count={fields.length}
        onAdd={() => append({ fittingType: "", quantity: 1, explicitEquivalentLengthFt: "" } as never)}
      >
        {fields.map((row, index) => {
          const rowErrors = get(errors, `${basePath}.fittings.${index}`) as
            | Record<string, { message?: string } | undefined>
            | undefined;
          const fittingType = watch(field(index, "fittingType")) as string | undefined;
          const published = publishedFittingLength(fittingType, nominalSize as string | undefined, fittings);

          return (
            <RowCard
              key={row.id}
              title={`Fitting ${index + 1}`}
              describedAs={`fitting ${index + 1} on ${describedAs}`}
              onDuplicate={() => insert(index + 1, { ...watch(`${basePath}.fittings.${index}` as never) } as never)}
              onRemove={() => remove(index)}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Fitting type"
                  options={typeOptions}
                  error={rowErrors?.fittingType?.message}
                  {...register(field(index, "fittingType"))}
                />
                <NumberField
                  label="Quantity"
                  error={rowErrors?.quantity?.message}
                  {...register(field(index, "quantity"))}
                />
              </div>

              {published === undefined ? (
                <NumberField
                  label="Equivalent length (each)"
                  unit={UNITS.length}
                  hint={
                    fittingType
                      ? "NFPA 13's chart publishes no length for this fitting at this pipe size — enter the value from the manufacturer or the standard. It is used exactly as entered, with no C factor rescaling, so give the length for this pipe."
                      : "Enter the equivalent length, or choose a fitting type above. A length entered here is used exactly as given, with no C factor rescaling."
                  }
                  error={rowErrors?.explicitEquivalentLengthFt?.message}
                  {...register(field(index, "explicitEquivalentLengthFt"))}
                />
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Published equivalent length: {published} {UNITS.length} each, in feet of
                  C&nbsp;=&nbsp;120 pipe (NFPA 13 Table 27.2.3.1.1). The calculation rescales it
                  for this pipe&apos;s C factor and reports the factor it used in the worksheet.
                </p>
              )}
            </RowCard>
          );
        })}
      </RowList>
    </div>
  );
}
