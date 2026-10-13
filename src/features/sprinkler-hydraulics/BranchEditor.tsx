"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField } from "@/components/ui/SelectField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import type { PipeRunInput } from "./defaults";
import { formatFlow, formatLength, formatPressure } from "./format";
import { UNITS } from "./labels";
import { junctionId, sprinklerNodeId } from "./network";
import { sizeOptions } from "./pipeOptions";
import { PipeRowHeader, PipeRunRow } from "./PipeRunRow";
import { RowActions, RowList } from "./RowList";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow, SprinklerFlowRow } from "./types";

/** An earlier branch listed in full, which a later one may be declared identical to. */
export interface ReferenceBranchOption {
  /** The branch's stable key -- what an identical branch stores. */
  key: string;
  /** What the designer calls it: "Branch 1". */
  label: string;
  sprinklerCount: number;
}

interface BranchEditorProps {
  form: SprinklerForm;
  branchIndex: number;
  branchCount: number;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: FittingEquivalentLengthTableRow[];
  /** What a new sprinkler on this branch starts with: K from step 2, and a pipe of the usual size. */
  newSprinkler: (position: number) => { kFactor: number; pipe: PipeRunInput };
  /**
   * How many sprinklers the plan lays out on a branch line: the remote area is 1.2 x sqrt(area)
   * long along a branch, and that length at the sprinkler spacing, rounded up, is how many fit.
   * From the API's plan; null until the spacing has been given.
   */
  plannedPerBranch: number | null;
  /** The remote area's length along a branch and the spacing it was divided by, to explain it. */
  planBasis?: { remoteAreaLengthFt: number; spacingFt: number } | null;
  /**
   * The branches before this one that are listed in full, which this one may repeat. Empty for the
   * first branch, which has nothing earlier to be identical to.
   */
  referenceOptions: ReferenceBranchOption[];
  /** What each listed sprinkler discharges, by node id, from the live calculation. */
  sprinklerFlows?: Record<string, SprinklerFlowRow>;
  /** True while those figures no longer match the input. */
  flowsStale?: boolean;
  onDuplicate: () => void;
  onRemove: () => void;
}

type FillField = "nominalSize" | "pipeLengthFt" | "elevationChangeFt";

const FILL_LABELS: Record<FillField, string> = {
  nominalSize: "size",
  pipeLengthFt: "length",
  elevationChangeFt: "rise",
};

/**
 * Copies this sprinkler's pipe size, length and/or rise onto the sprinklers after it on the same
 * branch. Spacing along a branch is usually uniform, so the first row is typed and the rest filled
 * in one click. Only those three fields are copied -- never fittings, which are particular to a
 * pipe -- and a size is skipped where the target's material and schedule don't offer it, with a
 * note saying so rather than leaving a size the API would reject.
 */
function FillRestOfBranch({
  form,
  sprinklersPath,
  index,
  count,
  materials,
}: {
  form: SprinklerForm;
  sprinklersPath: string;
  index: number;
  count: number;
  materials: PipeMaterialOption[];
}) {
  const [note, setNote] = useState<string | null>(null);
  if (index >= count - 1) return null;

  const setAt = form.setValue as unknown as (
    name: string,
    value: unknown,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean },
  ) => void;
  const pipeAt = (position: number) =>
    form.getValues(`${sprinklersPath}.${position}.pipe` as never) as unknown as Record<
      string,
      unknown
    >;

  function apply(fields: FillField[]) {
    const source = pipeAt(index);
    const targets = count - 1 - index;
    let skipped = 0;
    for (let position = index + 1; position < count; position += 1) {
      const target = pipeAt(position);
      for (const field of fields) {
        if (field === "nominalSize") {
          const offered = sizeOptions(
            materials,
            String(target.pipeMaterial ?? ""),
            target.schedule as string | undefined,
          ).some((option) => option.value === source.nominalSize);
          if (!offered) {
            skipped += 1;
            continue;
          }
        }
        setAt(`${sprinklersPath}.${position}.pipe.${field}`, source[field], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
    const what = fields.map((field) => FILL_LABELS[field]).join(", ");
    setNote(
      `Applied ${what} to the ${targets} sprinkler${targets === 1 ? "" : "s"} after this one` +
        (skipped > 0
          ? ` (${skipped} size${skipped === 1 ? "" : "s"} skipped: not offered for that pipe)`
          : "") +
        ".",
    );
  }

  const button =
    "rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          Use this pipe&apos;s … for the sprinklers after it:
        </span>
        {(["nominalSize", "pipeLengthFt", "elevationChangeFt"] as const).map((field) => (
          <button key={field} type="button" onClick={() => apply([field])} className={button}>
            {FILL_LABELS[field]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => apply(["nominalSize", "pipeLengthFt", "elevationChangeFt"])}
          className={button}
        >
          all three
        </button>
      </div>
      {note && (
        <p role="status" className="text-xs text-zinc-500 dark:text-zinc-400">
          {note}
        </p>
      )}
    </div>
  );
}

/** The pieces of a branch the summary and the opening rule read, as the form holds them. */
interface BranchSnapshot {
  identicalToKey?: string;
  sprinklers?: { kFactor?: unknown; pipe?: { nominalSize?: string; pipeLengthFt?: unknown } }[];
  crossMain?: {
    pipeMaterial?: string;
    schedule?: string;
    nominalSize?: string;
    pipeLengthFt?: unknown;
  };
}

const isBlank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

/**
 * One branch line: its sprinklers from the most remote inwards, each with the pipe after it, and
 * then the cross main that carries the branch on.
 *
 * A sprinkler and its pipe are one row, so every sprinkler is on a pipe by construction -- there
 * is no separate list of pipes to keep in step with the sprinklers, and no node ids to type. Which
 * pipe connects to which is where it sits: the pipe after a sprinkler runs to the next sprinkler,
 * the last runs to the branch's junction, and the cross main runs from the junction onward.
 *
 * The branch folds to a single line saying what is in it, so a network that is finished stays out
 * of the way. It opens on its own while a branch has something wrong in it, or a length not yet
 * entered, so nothing that needs attention is hidden behind it.
 *
 * A branch after the first can instead be declared identical to an earlier one. Nothing of it is
 * entered then but its cross main: the calculation takes that branch as it stands and balances it
 * at this junction. Its sprinklers are kept, hidden, so un-ticking the choice finds them as they
 * were.
 */
export function BranchEditor({
  form,
  branchIndex,
  branchCount,
  materials,
  materialsLoading,
  fittings,
  newSprinkler,
  plannedPerBranch,
  planBasis = null,
  referenceOptions,
  sprinklerFlows = {},
  flowsStale = false,
  onDuplicate,
  onRemove,
}: BranchEditorProps) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const identicalPath = `network.branches.${branchIndex}.identicalToKey` as const;
  const identicalToKey = String(watch(identicalPath) ?? "");
  const isIdentical = identicalToKey !== "";
  const reference = referenceOptions.find((option) => option.key === identicalToKey);
  // The nearest earlier listed branch is the usual thing to repeat, and what ticking the box starts on.
  const defaultReference = referenceOptions[referenceOptions.length - 1]?.key ?? "";

  const sprinklersPath = `network.branches.${branchIndex}.sprinklers` as const;
  const { fields, append, remove, insert } = useFieldArray({ control, name: sprinklersPath });

  const isLastBranch = branchIndex === branchCount - 1;
  const junction = junctionId(branchIndex);
  const nextJunction = junctionId(branchIndex + 1);
  const branchErrors = errors.network?.branches?.[branchIndex];
  const listError =
    (branchErrors?.sprinklers as { message?: string; root?: { message?: string } } | undefined)
      ?.message ??
    (branchErrors?.sprinklers as { root?: { message?: string } } | undefined)?.root?.message;

  // Open at the start when it is the first branch or still has lengths to enter; folded when it
  // arrives complete (a restored draft), so a finished network doesn't open as a wall of rows.
  const snapshot = watch(`network.branches.${branchIndex}`) as BranchSnapshot | undefined;
  const [open, setOpen] = useState(
    () =>
      branchIndex === 0 ||
      isBlank(snapshot?.crossMain?.pipeLengthFt) ||
      (snapshot?.sprinklers ?? []).some((sprinkler) => isBlank(sprinkler.pipe?.pipeLengthFt)),
  );
  const isOpen = open || !!branchErrors;

  // Only going over the plan's figure is flagged, and as a suggestion: the standard's 1.2 x sqrt(A)
  // is a minimum along the branch, so more sprinklers than that is allowed. Fewer is an ordinary
  // branch -- a short one at the end of a main -- and the total-count note above covers the demand.
  const overPlan = plannedPerBranch !== null && fields.length > plannedPerBranch;
  // The schema's message when it has one; otherwise what is already known here. Schema rules that
  // span the whole form only run once every field on the page is valid, and a choice that points
  // at a removed branch should not wait for that to be said.
  const identicalError =
    (branchErrors as { identicalToKey?: { message?: string } } | undefined)?.identicalToKey
      ?.message ??
    (isIdentical && !reference
      ? branchIndex === 0
        ? "The first branch has no earlier branch to repeat"
        : "Choose the branch this one repeats"
      : undefined);

  // --- the one line it folds to ---
  const sizeLabel = (size: string | undefined) =>
    size
      ? (sizeOptions(
          materials,
          snapshot?.crossMain?.pipeMaterial ?? "",
          snapshot?.crossMain?.schedule,
        ).find((option) => option.value === size)?.label ?? `${size}"`)
      : "";
  const crossMainLength = snapshot?.crossMain?.pipeLengthFt;
  const crossMainSummary = `cross main ${sizeLabel(snapshot?.crossMain?.nominalSize)}${
    isBlank(crossMainLength) ? ", length not entered" : ` × ${crossMainLength} ${UNITS.length}`
  }`;
  const pipeSizes = [
    ...new Set((snapshot?.sprinklers ?? []).map((sprinkler) => sprinkler.pipe?.nominalSize ?? "")),
  ].filter(Boolean);
  const summary = isIdentical
    ? `${reference ? `identical to ${reference.label}` : "identical to a branch that is not chosen"} · ${crossMainSummary}`
    : `${fields.length} sprinkler${fields.length === 1 ? "" : "s"}${
        pipeSizes.length > 0
          ? ` on ${pipeSizes.map((size) => sizeLabel(size)).join(", ")} pipe`
          : ""
      } · ${crossMainSummary}`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Fold" : "Open"} branch ${branchIndex + 1}`}
          className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{isOpen ? "▾" : "▸"}</span>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Branch {branchIndex + 1}
          </span>
          <span
            className={`min-w-0 truncate text-xs ${
              branchErrors ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {summary}
          </span>
        </button>
        <RowActions
          describedAs={`branch ${branchIndex + 1}`}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          removeDisabled={branchCount === 1}
        />
      </div>

      {isOpen && (
        <div className="flex flex-col gap-3">
          {(branchIndex > 0 || isIdentical) && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                  checked={isIdentical}
                  disabled={referenceOptions.length === 0 && !isIdentical}
                  onChange={(event) =>
                    setValue(identicalPath, event.target.checked ? defaultReference : "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
                Identical to an earlier branch
              </label>
              {isIdentical && (
                <div className="flex flex-col gap-2">
                  <div className="max-w-xs">
                    <SelectField
                      label="Identical to"
                      options={[
                        { value: "", label: "Choose a branch", disabled: true },
                        ...referenceOptions.map((option) => ({
                          value: option.key,
                          label: option.label,
                        })),
                      ]}
                      error={identicalError}
                      name={identicalPath}
                      // Controlled, so a choice that no longer exists shows as unchosen. An
                      // uncontrolled select quietly falls back to its first option when its options
                      // change, which would show a branch that the form does not hold.
                      value={reference ? identicalToKey : ""}
                      onChange={(event) =>
                        setValue(identicalPath, event.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {reference
                      ? `Same ${reference.sprinklerCount} sprinkler${reference.sprinklerCount === 1 ? "" : "s"} on the same pipes as ${reference.label}, so none are entered here. `
                      : ""}
                    The calculation takes that branch as it stands and works out its flow at this
                    branch&apos;s junction pressure. Only the cross main below — its distance to the
                    next branch — is entered.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isIdentical && (
            <>
              {plannedPerBranch !== null && !overPlan && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {fields.length} sprinkler{fields.length === 1 ? "" : "s"} on this branch; the plan
                  lays out {plannedPerBranch} per branch line.
                </p>
              )}
              {overPlan && (
                <p
                  role="status"
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                >
                  Suggestion: the plan lays out {plannedPerBranch} sprinkler
                  {plannedPerBranch === 1 ? "" : "s"} per branch line; this one has {fields.length}.
                  {planBasis
                    ? ` The remote area is ${formatLength(planBasis.remoteAreaLengthFt)} ${UNITS.length} long along a branch (1.2 × √A), which at ${formatLength(planBasis.spacingFt)} ${UNITS.length} spacing is ${plannedPerBranch} sprinklers, rounded up.`
                    : ""}{" "}
                  NFPA 13 sets that length as a minimum, so a longer branch is allowed — it just
                  means fewer branch lines are needed to cover the same area.
                </p>
              )}

              <RowList
                compact
                itemLabel="sprinkler"
                count={fields.length}
                onAdd={() => append(newSprinkler(fields.length) as never)}
                error={listError}
              >
                <PipeRowHeader firstColumn="Sprinkler" />
                {fields.map((field, index) => {
                  const sprinklerErrors = branchErrors?.sprinklers?.[index];
                  const kFactor = watch(`${sprinklersPath}.${index}.kFactor`);
                  const describedAs = `branch ${branchIndex + 1}, sprinkler ${index + 1}`;
                  const discharge = sprinklerFlows[sprinklerNodeId(branchIndex, index)];
                  return (
                    <PipeRunRow
                      key={field.id}
                      form={form}
                      basePath={`${sprinklersPath}.${index}.pipe`}
                      describedAs={describedAs}
                      label={`Sprinkler ${index + 1}`}
                      leading={
                        <span
                          title="K factor — change it under More"
                          className="flex-none rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          K {String(kFactor ?? "")}
                        </span>
                      }
                      readout={
                        discharge ? (
                          <span
                            className={`truncate text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 ${
                              flowsStale ? "opacity-60" : ""
                            }`}
                          >
                            {formatFlow(discharge.flowGpm)} {UNITS.flow} @{" "}
                            {formatPressure(discharge.pressurePsi)} {UNITS.pressure}
                          </span>
                        ) : null
                      }
                      detailExtra={
                        <div className="flex flex-col gap-3">
                          <div className="max-w-[10rem]">
                            <NumberField
                              label="K factor"
                              error={sprinklerErrors?.kFactor?.message}
                              {...register(`${sprinklersPath}.${index}.kFactor`)}
                            />
                          </div>
                          <FillRestOfBranch
                            form={form}
                            sprinklersPath={sprinklersPath}
                            index={index}
                            count={fields.length}
                            materials={materials}
                          />
                        </div>
                      }
                      materials={materials}
                      materialsLoading={materialsLoading}
                      fittings={fittings}
                      actions={
                        <RowActions
                          describedAs={`sprinkler ${index + 1} on branch ${branchIndex + 1}`}
                          onDuplicate={() =>
                            insert(
                              index + 1,
                              JSON.parse(
                                JSON.stringify(form.getValues(`${sprinklersPath}.${index}`)),
                              ) as never,
                            )
                          }
                          onRemove={() => remove(index)}
                          removeDisabled={fields.length === 1}
                        />
                      }
                    />
                  );
                })}
              </RowList>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Each row is a sprinkler and the pipe after it, which runs to the next sprinkler; the
                last one runs to the end of the branch (junction {junction}).
              </p>
            </>
          )}

          <div className="flex flex-col gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <PipeRowHeader firstColumn="Pipe" />
            <PipeRunRow
              form={form}
              basePath={`network.branches.${branchIndex}.crossMain`}
              describedAs={`the cross main after branch ${branchIndex + 1}`}
              label={isLastBranch ? "Cross main to riser" : `Cross main to ${nextJunction}`}
              materials={materials}
              materialsLoading={materialsLoading}
              fittings={fittings}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLastBranch
                ? `From ${junction} to the top of the riser.`
                : `From ${junction} to ${nextJunction}, where branch ${branchIndex + 2} joins.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
