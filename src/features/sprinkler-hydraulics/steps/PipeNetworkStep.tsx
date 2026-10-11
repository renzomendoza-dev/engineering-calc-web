"use client";

import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { BranchEditor } from "../BranchEditor";
import { newPipeRun } from "../defaults";
import { DeviceLossRowsInput } from "../DeviceLossRowsInput";
import { formatArea } from "../format";
import { UNITS } from "../labels";
import { countSprinklers, riserNodeIds, riserNodeLabel } from "../network";
import { PipeRunFields } from "../PipeRunFields";
import { RowCard, RowList } from "../RowList";
import { stepNumber } from "../schema";
import type { StepProps } from "../stepProps";

/**
 * Says how many sprinklers the remote area plan calls for against how many are listed.
 *
 * It exists because the hydraulic calculation counts only the sprinklers listed: fewer than the
 * plan means the demand is understated, and nothing else in the calculation would say so. A count
 * comparison only -- the plan itself, and every figure in it, comes from the API.
 */
function PlanCountNote({
  atLeast,
  perBranch,
  branchLines,
  listed,
}: {
  /** The count the plan calls for -- the exact layout total, or just the fewest that cover the area. */
  atLeast: number;
  /** Only known once the spacing along the branch was entered. */
  perBranch: number | null;
  branchLines: number | null;
  listed: number;
}) {
  const layoutKnown = perBranch !== null && branchLines !== null;
  const matches = listed === atLeast;
  const fewer = listed < atLeast;
  return (
    <p
      role="status"
      className={`rounded-md border px-3 py-2 text-xs ${
        fewer
          ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      {layoutKnown ? (
        <>
          The remote area plan (step {stepNumber("remote")}) calls for {atLeast} sprinklers —{" "}
          {perBranch} per branch line on {branchLines} branch line{branchLines === 1 ? "" : "s"}.
        </>
      ) : (
        <>
          At least {atLeast} sprinklers are needed to cover the area; enter the spacing in step{" "}
          {stepNumber("remote")} for the layout.
        </>
      )}{" "}
      You have listed {listed}.{" "}
      {matches
        ? "That matches the plan."
        : fewer
          ? "The demand counts only the sprinklers listed, so fewer than the plan understates it."
          : "That is more than the plan needs; the extra sprinklers add to the demand."}
    </p>
  );
}

/**
 * The network, entered the way it is drawn: branch by branch, each sprinkler with the pipe after
 * it, then the cross main to the next branch, then the riser. Nothing is wired by hand -- a
 * sprinkler and its pipe are one card and the connections follow from position (see network.ts),
 * so there are no node ids to type and no sprinkler that can be left off a pipe.
 */
export function PipeNetworkStep({
  form,
  reference,
  materials,
  materialsLoading,
  plan,
  legacyNetworkDropped,
}: StepProps) {
  const {
    control,
    register,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const {
    fields: branches,
    append: appendBranch,
    remove: removeBranch,
    insert: insertBranch,
    replace: replaceBranches,
  } = useFieldArray({ control, name: "network.branches" });
  const {
    fields: riserRuns,
    append: appendRiser,
    remove: removeRiser,
  } = useFieldArray({ control, name: "network.riser" });

  const [confirmingFill, setConfirmingFill] = useState(false);

  const hoseStreamGpm = Number(watch("hoseStreamGpm"));
  const hoseNode = watch("hoseStreamNodeId");
  const coverage = Number(watch("coveragePerSprinklerSqFt"));
  const network = watch("network");
  const listed = countSprinklers({ branches: network?.branches ?? [] });
  const { fittings } = reference;

  // What a new sprinkler or pipe starts with: the K, material, schedule and C factor from step 2.
  const kFactor = Number(watch("defaultKFactor"));
  const baseRun = {
    pipeMaterial: String(watch("defaultPipeMaterial") ?? ""),
    schedule: String(watch("defaultSchedule") ?? ""),
    cFactor: Number(watch("defaultCFactor")),
  };
  const newSprinkler = () => ({
    kFactor,
    pipe: newPipeRun({ ...baseRun, nominalSize: "1" }),
  });
  const newBranch = (sprinklerCount = 1) => ({
    sprinklers: Array.from({ length: sprinklerCount }, newSprinkler),
    crossMain: newPipeRun({ ...baseRun, nominalSize: "2" }),
  });

  // The hose stream is added at a point on the riser, and removing a riser run takes its point with
  // it. A choice that has vanished falls back to the top of the riser rather than leaving a select
  // that shows one thing while holding another.
  const riserIds = riserNodeIds(riserRuns.length);
  const riserIdsKey = riserIds.join("|");
  useEffect(() => {
    if (!riserIdsKey.split("|").includes(String(hoseNode))) {
      setValue("hoseStreamNodeId", riserIdsKey.split("|")[0], { shouldValidate: true });
    }
  }, [riserIdsKey, hoseNode, setValue]);
  const hoseOptions: SelectOption[] = riserIds.map((id) => ({
    value: id,
    label: riserNodeLabel(id, riserRuns.length),
  }));

  const planned =
    plan.result !== null &&
    plan.result.sprinklersPerBranch !== null &&
    plan.result.branchLines !== null
      ? { perBranch: plan.result.sprinklersPerBranch, branchLines: plan.result.branchLines }
      : null;

  /** Anything typed into the network, so replacing it from the plan can ask first. */
  const hasEnteredLengths = (network?.branches ?? []).some(
    (branch) =>
      String(branch.crossMain?.pipeLengthFt ?? "") !== "" ||
      branch.sprinklers.some((sprinkler) => String(sprinkler.pipe?.pipeLengthFt ?? "") !== ""),
  );

  function fillFromPlan() {
    if (!planned) return;
    replaceBranches(Array.from({ length: planned.branchLines }, () => newBranch(planned.perBranch)));
    setConfirmingFill(false);
  }

  const branchListError =
    (errors.network?.branches as { message?: string; root?: { message?: string } } | undefined)?.message ??
    (errors.network?.branches as { root?: { message?: string } } | undefined)?.root?.message;

  return (
    <div className="flex flex-col gap-8">
      {legacyNetworkDropped && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
        >
          Your saved calculation had its pipe network in the previous layout, which can&apos;t be
          carried across: sprinklers and pipes are now entered together, branch by branch.
          Everything else was kept — enter the network again below.
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Branches</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Work from the most remote sprinkler towards the supply. Each sprinkler is entered with
            the pipe after it, and each branch ends in a cross main to the next. Every sprinkler
            covers{" "}
            {Number.isFinite(coverage) && coverage > 0
              ? `${formatArea(coverage)} ${UNITS.area}`
              : "the same area"}
            , set once in step {stepNumber("project")}.
          </p>
        </div>

        {plan.result && (
          <PlanCountNote
            atLeast={plan.result.totalSprinklers ?? plan.result.sprinklersForArea}
            perBranch={plan.result.sprinklersPerBranch}
            branchLines={plan.result.branchLines}
            listed={listed}
          />
        )}

        {planned && (
          <div className="flex flex-wrap items-center gap-2">
            {confirmingFill ? (
              <>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Replace the branches below with {planned.branchLines} of {planned.perBranch}?
                </span>
                <button
                  type="button"
                  onClick={fillFromPlan}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Yes, replace
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingFill(false)}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => (hasEnteredLengths ? setConfirmingFill(true) : fillFromPlan())}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Set up {planned.branchLines} branch{planned.branchLines === 1 ? "" : "es"} of{" "}
                {planned.perBranch} from the plan
              </button>
            )}
          </div>
        )}

        <RowList
          itemLabel="branch"
          count={branches.length}
          onAdd={() => appendBranch(newBranch() as never)}
          error={branchListError}
        >
          {branches.map((branch, index) => (
            <BranchEditor
              key={branch.id}
              form={form}
              branchIndex={index}
              branchCount={branches.length}
              materials={materials}
              materialsLoading={materialsLoading}
              fittings={fittings}
              newSprinkler={newSprinkler}
              plannedPerBranch={planned?.perBranch ?? null}
              onDuplicate={() =>
                // A copy of the branch as it stands: same sprinklers, same pipes. Its cross main is
                // its own, so the distance to whatever follows it is editable independently.
                insertBranch(
                  index + 1,
                  JSON.parse(JSON.stringify(getValues(`network.branches.${index}`))) as never,
                )
              }
              onRemove={() => removeBranch(index)}
            />
          ))}
        </RowList>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Riser and supply main
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Optional. The pipe after the last cross main, from the top of the riser down to the
            supply connection — one run for each change of size or fittings. With none, the cross
            main ends at the supply.
          </p>
        </div>
        <RowList
          itemLabel="riser run"
          count={riserRuns.length}
          onAdd={() => appendRiser(newPipeRun({ ...baseRun, nominalSize: "3" }) as never)}
        >
          {riserRuns.map((run, index) => (
            <RowCard
              key={run.id}
              title={`Riser run ${index + 1}`}
              describedAs={`riser run ${index + 1}`}
              onDuplicate={() =>
                appendRiser(JSON.parse(JSON.stringify(getValues(`network.riser.${index}`))) as never)
              }
              onRemove={() => removeRiser(index)}
            >
              <PipeRunFields
                form={form}
                basePath={`network.riser.${index}`}
                materials={materials}
                materialsLoading={materialsLoading}
                fittings={fittings}
                describedAs={`riser run ${index + 1}`}
              />
            </RowCard>
          ))}
        </RowList>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Device losses</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Optional. Fixed losses through valves and devices, in {UNITS.pressure}.
          </p>
        </div>
        <DeviceLossRowsInput form={form} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hose stream</h3>
        <div className="max-w-sm">
          <SelectField
            label="Hose stream added at"
            options={hoseOptions}
            hint={
              hoseStreamGpm > 0
                ? `The ${hoseStreamGpm} ${UNITS.flow} allowance from step ${stepNumber("project")} is added here and flows through any riser pipe below it.`
                : `Not needed while the hose stream allowance in step ${stepNumber("project")} is 0.`
            }
            error={errors.hoseStreamNodeId?.message}
            {...register("hoseStreamNodeId")}
          />
        </div>
      </section>
    </div>
  );
}
