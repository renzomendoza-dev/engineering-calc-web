"use client";

import { get, useFieldArray } from "react-hook-form";
import type { SelectOption } from "@/components/ui/SelectField";
import { UNITS } from "./labels";
import { publishedFittingLength } from "./request";
import { RowActions, RowList } from "./RowList";
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

const INPUT_CLASS =
  "w-full rounded-md border bg-white px-2 py-1.5 text-base shadow-sm outline-none transition-colors sm:text-sm dark:bg-zinc-950";
const OK_BORDER =
  "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700";
const ERROR_BORDER = "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500";

interface PipeFittingsInputProps {
  form: SprinklerForm;
  /** Where this pipe lives in the form, e.g. "network.branches.0.sprinklers.2.pipe". */
  basePath: string;
  fittings: FittingEquivalentLengthTableRow[];
  /** Names the pipe in the buttons' accessible labels, e.g. "branch 1, sprinkler 2". */
  describedAs: string;
}

/**
 * Fittings on one pipe, one line each. The equivalent length comes from NFPA 13's published chart
 * when it has a value for this fitting at this pipe size; where it doesn't -- the chart leaves
 * plenty of combinations blank -- a field for an explicit length appears instead, since the API
 * rejects a fitting it can't resolve.
 *
 * The two paths behave differently downstream, so the line under the row says which applies: a
 * chart lookup is rescaled for the pipe's C factor by the calculation, while a length typed in
 * here is used exactly as entered.
 */
export function PipeFittingsInput({
  form,
  basePath,
  fittings,
  describedAs,
}: PipeFittingsInputProps) {
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
    <RowList
      compact
      itemLabel="fitting"
      count={fields.length}
      onAdd={() =>
        append({ fittingType: "", quantity: 1, explicitEquivalentLengthFt: "" } as never)
      }
    >
      {fields.map((row, index) => {
        const rowErrors = get(errors, `${basePath}.fittings.${index}`) as
          Record<string, { message?: string } | undefined> | undefined;
        const fittingType = watch(field(index, "fittingType")) as string | undefined;
        const published = publishedFittingLength(
          fittingType,
          nominalSize as string | undefined,
          fittings,
        );
        const messages = [
          rowErrors?.fittingType?.message,
          rowErrors?.quantity?.message,
          rowErrors?.explicitEquivalentLengthFt?.message,
        ].filter(Boolean);

        return (
          <div key={row.id} className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,7rem)_auto] items-end gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Fitting</span>
                <select
                  aria-label={`Fitting type, fitting ${index + 1} on ${describedAs}`}
                  aria-invalid={!!rowErrors?.fittingType}
                  className={`${INPUT_CLASS} ${rowErrors?.fittingType ? ERROR_BORDER : OK_BORDER}`}
                  {...register(field(index, "fittingType"))}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Qty</span>
                <input
                  type="number"
                  step="any"
                  aria-label={`Quantity, fitting ${index + 1} on ${describedAs}`}
                  aria-invalid={!!rowErrors?.quantity}
                  className={`${INPUT_CLASS} ${rowErrors?.quantity ? ERROR_BORDER : OK_BORDER}`}
                  {...register(field(index, "quantity"))}
                />
              </label>
              {published === undefined ? (
                <label className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Length each ({UNITS.length})
                  </span>
                  <input
                    type="number"
                    step="any"
                    aria-label={`Equivalent length each, fitting ${index + 1} on ${describedAs}`}
                    aria-invalid={!!rowErrors?.explicitEquivalentLengthFt}
                    className={`${INPUT_CLASS} ${
                      rowErrors?.explicitEquivalentLengthFt ? ERROR_BORDER : OK_BORDER
                    }`}
                    {...register(field(index, "explicitEquivalentLengthFt"))}
                  />
                </label>
              ) : (
                <p className="pb-1.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {published} {UNITS.length} each
                </p>
              )}
              <RowActions
                describedAs={`fitting ${index + 1} on ${describedAs}`}
                onDuplicate={() =>
                  insert(index + 1, { ...watch(`${basePath}.fittings.${index}` as never) } as never)
                }
                onRemove={() => remove(index)}
              />
            </div>
            {messages.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">{messages.join(" · ")}</p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {published === undefined
                ? fittingType
                  ? "NFPA 13's chart publishes no length for this fitting at this pipe size — enter one from the manufacturer or the standard. It is used exactly as entered, with no C factor rescaling."
                  : "Choose a fitting type, or enter an equivalent length. A length entered here is used exactly as given, with no C factor rescaling."
                : "From NFPA 13 Table 27.2.3.1.1, in feet of C = 120 pipe; the calculation rescales it for this pipe's C factor and reports the factor in the worksheet."}
            </p>
          </div>
        );
      })}
    </RowList>
  );
}
