"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePipeMaterials } from "@/hooks/usePipeMaterials";
import { useSprinklerReferenceData } from "@/hooks/useSprinklerReferenceData";
import { CalculationWarnings } from "./CalculationWarnings";
import { countSprinklers } from "./network";
import { comparePlanCount, moreThanPlanWarning } from "./planCount";
import { DemandSummaryPanel } from "./DemandSummaryPanel";
import { DEFAULT_SPRINKLER_FORM } from "./defaults";
import { clearDraft, loadDraftDetailed, saveDraft } from "./draft";
import {
  STEPS,
  STEP_FIELDS,
  STEP_LABELS,
  sprinklerHydraulicsSchema,
  type SprinklerFormInput,
  type SprinklerFormValues,
  type StepId,
} from "./schema";
import { StepNav } from "./StepNav";
import { DesignDataStep } from "./steps/DesignDataStep";
import { PipeNetworkStep } from "./steps/PipeNetworkStep";
import { ProjectHazardStep } from "./steps/ProjectHazardStep";
import { ResultsStep } from "./steps/ResultsStep";
import { WaterSupplyStep } from "./steps/WaterSupplyStep";
import { useRemoteAreaPlan } from "./useRemoteAreaPlan";
import { useSprinklerCalculation } from "./useSprinklerCalculation";

/** Long enough that a draft isn't written on every keystroke, short enough to survive a reload. */
const DRAFT_SAVE_DEBOUNCE_MS = 500;

/**
 * The whole five-step flow: one react-hook-form instance shared by every step, a draft kept in
 * localStorage, and a result recalculated on the API as the input changes.
 *
 * There is no submit button by design — the calculation is live (see useSprinklerCalculation), so
 * the form's own submit event is suppressed and Enter does nothing destructive.
 */
export function SprinklerHydraulicsCalculator() {
  const form = useForm<SprinklerFormInput, unknown, SprinklerFormValues>({
    resolver: zodResolver(sprinklerHydraulicsSchema),
    defaultValues: DEFAULT_SPRINKLER_FORM,
    // Live validation: nothing is submitted, so errors have to appear as the user types, and the
    // live calculation depends on knowing when the input became valid.
    mode: "onChange",
  });
  const {
    reset,
    setError,
    trigger,
    watch,
    formState: { isDirty },
  } = form;
  const [step, setStep] = useState<StepId>("project");
  const [restored, setRestored] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  // True when the restored draft had its network in the previous flat layout, which can't be
  // carried across. The network step says so once, rather than showing an unexplained empty list.
  const [legacyNetworkDropped, setLegacyNetworkDropped] = useState(false);

  const reference = useSprinklerReferenceData();
  const { materials, isLoading: materialsLoading } = usePipeMaterials();

  const values = watch();
  const calculation = useSprinklerCalculation(values, reference.fittings);
  // The hazard's published maximum coverage per sprinkler, so the plan can flag spacing that
  // exceeds it. Null while the preset table loads: the plan then just doesn't check.
  const maxCoverage =
    reference.hazardPresets.find((preset) => preset.hazard === values.hazard)
      ?.maxCoverageSqFtPerSprinkler ?? null;
  const plan = useRemoteAreaPlan(values, maxCoverage);
  // Listing more sprinklers than the plan calls for is not an error -- the calculation counts them
  // all -- but its demand is then for a larger area than the one declared, which should be said on
  // every step rather than only where the network is entered. Fewer is flagged in the network
  // step alone: it is the state of every network while it is being entered, and a banner over each
  // sprinkler added would be noise.
  const plannedCount = plan.result ? plan.result.sprinklersForArea : null;
  const listedCount = countSprinklers(values.network ?? { branches: [] });
  const planWarnings =
    plannedCount !== null && comparePlanCount(listedCount, plannedCount) === "more"
      ? [moreThanPlanWarning(listedCount, plannedCount)]
      : [];
  const { generalError, setGeneralError, handleApiError } = useApiFormError(
    setError,
    DEFAULT_SPRINKLER_FORM,
  );

  // Restoring after mount, not during render: the server renders the defaults, so reading storage
  // any earlier would make the first client render disagree with the server's HTML.
  useEffect(() => {
    const draft = loadDraftDetailed();
    // keepDefaultValues leaves the blank form as the baseline react-hook-form compares against,
    // so a restored draft still counts as dirty — which is what tells the save effect below that
    // there is something worth keeping.
    if (draft) {
      reset(draft.values, { keepDefaultValues: true });
      setLegacyNetworkDropped(draft.droppedLegacyNetwork);
    }
    setRestored(true);
  }, [reset]);

  const serialized = JSON.stringify(values);
  const debouncedSerialized = useDebouncedValue(serialized, DRAFT_SAVE_DEBOUNCE_MS);
  useEffect(() => {
    // Before the restore has run the form still holds the defaults; writing them would overwrite
    // the very draft that's about to be loaded.
    if (!restored) return;
    // An untouched form holds nothing worth restoring, so nothing is stored for it — which is
    // also what keeps "Clear saved inputs" cleared, rather than immediately writing the blank
    // form back under the same key.
    if (!isDirty) {
      clearDraft();
      return;
    }
    saveDraft(debouncedSerialized);
  }, [debouncedSerialized, isDirty, restored]);

  // useEffectEvent keeps these out of the dependency list: both close over state setters that
  // change identity every render, and the effect should run when the error changes, nothing else.
  const applyApiError = useEffectEvent((err: unknown) => handleApiError(err));
  const clearApiError = useEffectEvent(() => setGeneralError(null));
  useEffect(() => {
    if (calculation.error) {
      applyApiError(calculation.error);
    } else {
      clearApiError();
    }
  }, [calculation.error]);

  const currentIndex = STEPS.indexOf(step);

  async function goTo(next: StepId) {
    const nextIndex = STEPS.indexOf(next);
    if (nextIndex > currentIndex) {
      // Validate every step being left behind, not just the current one, so a jump forward can't
      // skip past an incomplete step.
      const fields = STEPS.slice(0, nextIndex).flatMap((passed) => STEP_FIELDS[passed]);
      const valid = await trigger(fields as Path<SprinklerFormInput>[]);
      if (!valid) return;
    }
    setStep(next);
    setConfirmingClear(false);
    // The notice has been seen once the network step is left; the draft is saved in the new shape.
    if (next !== "network") setLegacyNetworkDropped(false);
  }

  function clearSavedInputs() {
    clearDraft();
    reset(DEFAULT_SPRINKLER_FORM);
    setGeneralError(null);
    setStep("project");
    setConfirmingClear(false);
    setLegacyNetworkDropped(false);
  }

  // Keyed by node, so each sprinkler row finds its own figures without searching.
  const sprinklerFlows = Object.fromEntries(
    (calculation.result?.sprinklers ?? []).map((row) => [row.nodeId, row]),
  );

  const stepProps = {
    form,
    reference,
    materials,
    materialsLoading,
    plan,
    legacyNetworkDropped,
    sprinklerFlows,
    flowsStale: calculation.isStale || !calculation.isComplete,
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6 pb-20 lg:pb-0">
        <StepNav current={step} onSelect={goTo} />

        <FormErrorBanner message={generalError} />
        {calculation.result && (
          <CalculationWarnings warnings={[...planWarnings, ...calculation.result.warnings]} />
        )}

        <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {currentIndex + 1}. {STEP_LABELS[step]}
          </h2>

          {step === "project" && <ProjectHazardStep {...stepProps} />}
          {step === "design" && <DesignDataStep {...stepProps} />}
          {step === "supply" && <WaterSupplyStep {...stepProps} />}
          {step === "network" && <PipeNetworkStep {...stepProps} />}
          {step === "results" && <ResultsStep state={calculation} form={form} />}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(STEPS[currentIndex - 1])}
              disabled={currentIndex === 0}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => goTo(STEPS[currentIndex + 1])}
              disabled={currentIndex === STEPS.length - 1}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              Next
            </button>
          </div>

          {confirmingClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Clear everything?</span>
              <button
                type="button"
                onClick={clearSavedInputs}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Yes, clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Clear saved inputs
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Your entries are kept in this browser only, so you can reload without losing them. They
          are never sent anywhere except to run the calculation.
        </p>
      </div>

      <DemandSummaryPanel state={calculation} hasError={generalError !== null} />
    </div>
  );
}
