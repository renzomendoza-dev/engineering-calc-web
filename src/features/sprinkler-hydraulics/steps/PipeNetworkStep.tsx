"use client";

import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { NumberField } from "@/components/ui/NumberField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { formatApiText } from "@/lib/apiText";
import { BranchEditor, type ReferenceBranchOption } from "../BranchEditor";
import { newBranchKey, newPipeRun } from "../defaults";
import { DeviceLossRowsInput } from "../DeviceLossRowsInput";
import { formatArea } from "../format";
import { LayoutWorking } from "../LayoutWorking";
import { UNITS } from "../labels";
import { comparePlanCount } from "../planCount";
import { countSprinklers, isIdenticalBranch, riserNodeIds, riserNodeLabel } from "../network";
import { PipeRowHeader, PipeRunRow } from "../PipeRunRow";
import { RowActions, RowList } from "../RowList";
import { stepNumber } from "../schema";
import type { StepProps } from "../stepProps";

/**
 * Says how many sprinklers the design area needs against how many are listed.
 *
 * The figure to compare with is the fewest sprinklers that cover the area, not the layout's total:
 * the layout rounds up to whole branch lines, so it can hold more positions than the area needs
 * (3 per branch on 3 branches is 9 positions for an area that takes 8). Those extra positions are
 * simply not in the area of operation, and leaving them out is the normal case, not a shortfall.
 *
 * The hydraulic calculation counts only the sprinklers listed. Fewer than the area needs means the
 * demand is understated, and nothing else in the calculation would say so; more means it is for a
 * larger area than the one declared. Neither stops the calculation, so both are flagged rather than
 * blocked. A count comparison only -- the plan itself, and every figure in it, comes from the API.
 */
function PlanCountNote({
  required,
  layoutTotal,
  perBranch,
  branchLines,
  listed,
}: {
  /** The fewest sprinklers that cover the design area. */
  required: number;
  /** Positions in the layout (per branch x branch lines); null until the spacing was entered. */
  layoutTotal: number | null;
  perBranch: number | null;
  branchLines: number | null;
  listed: number;
}) {
  const layoutKnown = perBranch !== null && branchLines !== null && layoutTotal !== null;
  const status = comparePlanCount(listed, required);
  const matches = status === "match";
  const fewer = status === "fewer";
  const leftOut = layoutKnown ? layoutTotal - required : 0;
  return (
    <p
      role="status"
      className={`rounded-md border px-3 py-2 text-xs ${
        !matches
          ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      {layoutKnown ? (
        <>
          The design area needs {required} sprinklers — {perBranch} per branch line on {branchLines}{" "}
          branch line{branchLines === 1 ? "" : "s"}
          {leftOut > 0
            ? `, which has room for ${layoutTotal}. ${leftOut === 1 ? "The position" : `The ${leftOut} positions`} nearest the main on the last branch ${leftOut === 1 ? "is" : "are"} not in the area of operation: leave ${leftOut === 1 ? "it" : "them"} out of the calculation.`
            : "."}
        </>
      ) : (
        <>
          The design area needs at least {required} sprinklers; enter the spacing along a branch
          line above for the layout.
        </>
      )}{" "}
      You have listed {listed}.{" "}
      {matches
        ? "That matches."
        : fewer
          ? "The demand counts only the sprinklers listed, so fewer than the area needs understates it."
          : "That is more than the area needs. Every sprinkler listed is counted, so the demand covers a larger area of operation than the design area — conservative rather than invalid. Remove the extras, or raise the design area in step 1 if that is intended."}
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

  // Which way of filling from the plan is waiting on a "replace what I entered?" answer, if any.
  const [confirmingFill, setConfirmingFill] = useState<"listed" | "identical" | null>(null);

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
    key: newBranchKey(),
    identicalToKey: "",
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
      setValue("hoseStreamNodeId", riserIdsKey.split("|")[0], {
        shouldValidate: true,
      });
    }
  }, [riserIdsKey, hoseNode, setValue]);
  const hoseOptions: SelectOption[] = riserIds.map((id) => ({
    value: id,
    label: riserNodeLabel(id, riserRuns.length),
  }));

  // Which earlier branches a branch may be declared identical to: the ones listed in full. A copy
  // of a copy is not offered, since "identical to" always means a branch that is actually entered.
  const referenceOptionsFor = (index: number): ReferenceBranchOption[] =>
    (network?.branches ?? []).slice(0, index).flatMap((branch, position) =>
      isIdenticalBranch(branch)
        ? []
        : [
            {
              key: String(branch.key),
              label: `Branch ${position + 1}`,
              sprinklerCount: branch.sprinklers.length,
            },
          ],
    );

  // The layout fields are all null until the spacing was sent, and all present after; narrowing
  // them together means the working below never has to guess.
  const result = plan.result;
  const layout =
    result !== null &&
    result.sprinklersPerBranch !== null &&
    result.branchLines !== null &&
    result.totalSprinklers !== null &&
    result.totalProtectedAreaSqFt !== null &&
    result.branchSpacingFt !== null
      ? {
          perBranch: result.sprinklersPerBranch,
          branchLines: result.branchLines,
          total: result.totalSprinklers,
          protectedArea: result.totalProtectedAreaSqFt,
          branchSpacing: result.branchSpacingFt,
        }
      : null;

  // What the per-branch figure was worked from, so a branch that goes over it can say why.
  const spacingFt = Number(watch("sprinklerSpacingFt"));
  const planBasis =
    plan.result !== null && Number.isFinite(spacingFt) && spacingFt > 0
      ? { remoteAreaLengthFt: plan.result.remoteAreaLengthFt, spacingFt }
      : null;

  const planned =
    plan.result !== null &&
    plan.result.sprinklersPerBranch !== null &&
    plan.result.branchLines !== null
      ? {
          perBranch: plan.result.sprinklersPerBranch,
          branchLines: plan.result.branchLines,
          required: plan.result.sprinklersForArea,
        }
      : null;

  /** Anything typed into the network, so replacing it from the plan can ask first. */
  const hasEnteredLengths = (network?.branches ?? []).some(
    (branch) =>
      String(branch.crossMain?.pipeLengthFt ?? "") !== "" ||
      branch.sprinklers.some((sprinkler) => String(sprinkler.pipe?.pipeLengthFt ?? "") !== ""),
  );

  /**
   * Replaces the branches with the plan's layout. With `identical`, branch 1 is listed and every
   * later branch is declared identical to it -- the usual case, and the one that needs no more
   * entry than a cross main each. Their sprinklers are still created, hidden, so un-ticking the
   * choice leaves something to start from.
   */
  function fillFromPlan(identical: boolean) {
    if (!planned) return;
    // Whole branches carry the layout's per-branch count; the last carries what the area still
    // needs, which is fewer when the layout rounds up past it (3 + 3 + 2 for an area of 8).
    const lastCount = Math.max(1, planned.required - planned.perBranch * (planned.branchLines - 1));
    const first = newBranch(planned.perBranch);
    const rest = Array.from({ length: planned.branchLines - 1 }, (_, index) => {
      const isLast = index === planned.branchLines - 2;
      const branch = newBranch(isLast ? lastCount : planned.perBranch);
      // A branch carrying the full count is the same as the first, so it can be declared so; the
      // short one at the end is not, and is listed.
      return identical && !(isLast && lastCount !== planned.perBranch)
        ? { ...branch, identicalToKey: first.key }
        : branch;
    });
    // A single branch line has no "last" beyond the first, which then carries the lot.
    if (planned.branchLines === 1) first.sprinklers = newBranch(lastCount).sprinklers;
    replaceBranches([first, ...rest] as never);
    setConfirmingFill(null);
  }

  const branchListError =
    (errors.network?.branches as { message?: string; root?: { message?: string } } | undefined)
      ?.message ??
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

        <div className="max-w-sm">
          <NumberField
            label="Sprinkler spacing along a branch line (optional)"
            unit={UNITS.length}
            hint="Distance between neighbouring sprinklers on one branch. It lays the remote area out — sprinklers per branch line and how many branch lines — and is not used by the hydraulic calculation, which takes the pipe lengths below."
            error={errors.sprinklerSpacingFt?.message}
            {...register("sprinklerSpacingFt")}
          />
        </div>

        {plan.error != null && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
          >
            The remote area plan could not be worked out.{" "}
            {plan.error instanceof Error ? formatApiText(plan.error.message) : null}
          </div>
        )}

        {plan.result && (
          <PlanCountNote
            required={plan.result.sprinklersForArea}
            layoutTotal={plan.result.totalSprinklers}
            perBranch={plan.result.sprinklersPerBranch}
            branchLines={plan.result.branchLines}
            listed={listed}
          />
        )}

        {result && layout && (
          <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              How the layout is worked out
            </summary>
            <div className={`p-4 pt-0 ${plan.isStale || plan.isCalculating ? "opacity-60" : ""}`}>
              <LayoutWorking plan={result} {...layout} />
            </div>
          </details>
        )}

        {result && result.warnings.length > 0 && (
          <div
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
          >
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
              {result.warnings.map((warning) => (
                <li key={warning}>{formatApiText(warning)}</li>
              ))}
            </ul>
          </div>
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
                  onClick={() => fillFromPlan(confirmingFill === "identical")}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Yes, replace
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingFill(null)}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    hasEnteredLengths ? setConfirmingFill("listed") : fillFromPlan(false)
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Set up {planned.branchLines} branch{planned.branchLines === 1 ? "" : "es"} of{" "}
                  {planned.perBranch} from the plan
                </button>
                {planned.branchLines > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      hasEnteredLengths ? setConfirmingFill("identical") : fillFromPlan(true)
                    }
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    …with branches 2–{planned.branchLines} identical to branch 1
                  </button>
                )}
              </>
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
              planBasis={planBasis}
              referenceOptions={referenceOptionsFor(index)}
              onDuplicate={() =>
                // A copy of the branch as it stands: same sprinklers, same pipes. Its cross main is
                // its own, so the distance to whatever follows it is editable independently. It
                // gets a key of its own, so nothing that pointed at the original points at it.
                insertBranch(index + 1, {
                  ...JSON.parse(JSON.stringify(getValues(`network.branches.${index}`))),
                  key: newBranchKey(),
                } as never)
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
          compact
          itemLabel="riser run"
          count={riserRuns.length}
          onAdd={() => appendRiser(newPipeRun({ ...baseRun, nominalSize: "3" }) as never)}
        >
          <PipeRowHeader firstColumn="Run" />
          {riserRuns.map((run, index) => (
            <PipeRunRow
              key={run.id}
              form={form}
              basePath={`network.riser.${index}`}
              describedAs={`riser run ${index + 1}`}
              label={`Riser run ${index + 1}`}
              materials={materials}
              materialsLoading={materialsLoading}
              fittings={fittings}
              actions={
                <RowActions
                  describedAs={`riser run ${index + 1}`}
                  onDuplicate={() =>
                    appendRiser(
                      JSON.parse(JSON.stringify(getValues(`network.riser.${index}`))) as never,
                    )
                  }
                  onRemove={() => removeRiser(index)}
                />
              }
            />
          ))}
        </RowList>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Devices and hose stream
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Optional. Fixed losses through valves and devices, in {UNITS.pressure}, and where the
            hose stream allowance is added on the riser.
          </p>
        </div>
        <DeviceLossRowsInput form={form} />
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
