"use client";

import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import type { PipeMaterialOption } from "@/features/pipe-velocity/types";
import { PipeRunFields } from "./PipeRunFields";
import { RowCard, RowList } from "./RowList";
import { junctionId } from "./network";
import type { SprinklerForm } from "./stepProps";
import type { FittingEquivalentLengthTableRow } from "./types";
import type { PipeRunInput } from "./defaults";

interface BranchEditorProps {
  form: SprinklerForm;
  branchIndex: number;
  branchCount: number;
  materials: PipeMaterialOption[];
  materialsLoading: boolean;
  fittings: FittingEquivalentLengthTableRow[];
  /** What a new sprinkler on this branch starts with: K from step 2, and a pipe of the usual size. */
  newSprinkler: () => { kFactor: number; pipe: PipeRunInput };
  /** Sprinklers per branch line the remote area plan calls for, when it has worked that out. */
  plannedPerBranch: number | null;
  onDuplicate: () => void;
  onRemove: () => void;
}

/**
 * One branch line: its sprinklers from the most remote inwards, each with the pipe after it, and
 * then the cross main that carries the branch on.
 *
 * A sprinkler and its pipe are one card, so every sprinkler is on a pipe by construction -- there
 * is no separate list of pipes to keep in step with the sprinklers, and no node ids to type. Which
 * pipe connects to which is where it sits: the pipe after a sprinkler runs to the next sprinkler,
 * the last runs to the branch's junction, and the cross main runs from the junction onward.
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
  onDuplicate,
  onRemove,
}: BranchEditorProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const sprinklersPath = `network.branches.${branchIndex}.sprinklers` as const;
  const { fields, append, remove, insert } = useFieldArray({ control, name: sprinklersPath });

  const isLastBranch = branchIndex === branchCount - 1;
  const junction = junctionId(branchIndex);
  const nextJunction = junctionId(branchIndex + 1);
  const branchErrors = errors.network?.branches?.[branchIndex];
  const listError =
    (branchErrors?.sprinklers as { message?: string; root?: { message?: string } } | undefined)?.message ??
    (branchErrors?.sprinklers as { root?: { message?: string } } | undefined)?.root?.message;

  const offPlan = plannedPerBranch !== null && fields.length !== plannedPerBranch;

  return (
    <RowCard
      title={`Branch ${branchIndex + 1}`}
      describedAs={`branch ${branchIndex + 1}`}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
      removeDisabled={branchCount === 1}
    >
      {plannedPerBranch !== null && (
        <p
          className={`text-xs ${
            offPlan ? "text-amber-700 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {fields.length} sprinkler{fields.length === 1 ? "" : "s"} on this branch; the plan calls
          for {plannedPerBranch}.
        </p>
      )}

      <RowList
        itemLabel="sprinkler"
        count={fields.length}
        onAdd={() => append(newSprinkler() as never)}
        error={listError}
      >
        {fields.map((field, index) => {
          const isLast = index === fields.length - 1;
          const sprinklerErrors = branchErrors?.sprinklers?.[index];
          return (
            <RowCard
              key={field.id}
              title={`Sprinkler ${index + 1}`}
              describedAs={`sprinkler ${index + 1} on branch ${branchIndex + 1}`}
              onDuplicate={() =>
                insert(index + 1, JSON.parse(JSON.stringify(form.getValues(`${sprinklersPath}.${index}`))) as never)
              }
              onRemove={() => remove(index)}
              removeDisabled={fields.length === 1}
            >
              <div className="max-w-xs">
                <NumberField
                  label="K factor"
                  error={sprinklerErrors?.kFactor?.message}
                  {...register(`${sprinklersPath}.${index}.kFactor`)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Pipe after this sprinkler
                  <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    {isLast
                      ? `to the end of the branch (${junction})`
                      : `to sprinkler ${index + 2}`}
                  </span>
                </p>
                <PipeRunFields
                  form={form}
                  basePath={`${sprinklersPath}.${index}.pipe`}
                  materials={materials}
                  materialsLoading={materialsLoading}
                  fittings={fittings}
                  describedAs={`branch ${branchIndex + 1}, sprinkler ${index + 1}`}
                />
              </div>
            </RowCard>
          );
        })}
      </RowList>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cross main
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {isLastBranch
              ? `from ${junction} to the top of the riser`
              : `from ${junction} to ${nextJunction}, where branch ${branchIndex + 2} joins`}
          </span>
        </p>
        <PipeRunFields
          form={form}
          basePath={`network.branches.${branchIndex}.crossMain`}
          materials={materials}
          materialsLoading={materialsLoading}
          fittings={fittings}
          describedAs={`the cross main after branch ${branchIndex + 1}`}
        />
      </div>
    </RowCard>
  );
}
