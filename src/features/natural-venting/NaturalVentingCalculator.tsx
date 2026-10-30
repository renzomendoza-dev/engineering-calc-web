"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { useApiFormError } from "@/hooks/useApiFormError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DEFAULT_NATURAL_VENTING_FORM } from "./defaults";
import { clearDraft, loadDraft, saveDraft } from "./draft";
import {
  STEPS,
  STEP_FIELDS,
  STEP_LABELS,
  naturalVentingSchema,
  type NaturalVentingFormInput,
  type NaturalVentingFormValues,
  type StepId,
} from "./schema";
import { StepNav } from "./StepNav";
import { ConditionsStep } from "./steps/ConditionsStep";
import { FireCasesStep } from "./steps/FireCasesStep";
import { ResultsStep } from "./steps/ResultsStep";
import { ZonesStep } from "./steps/ZonesStep";
import { useNaturalVentingCalculation } from "./useNaturalVentingCalculation";

/** Long enough that a draft isn't written on every keystroke, short enough to survive a reload. */
const DRAFT_SAVE_DEBOUNCE_MS = 500;

/**
 * The four-step flow: one react-hook-form instance shared by every step, a draft kept in
 * localStorage, and a result recalculated on the API as the input changes. Same shape as the
 * sprinkler hydraulic calculator: no submit button, the form's own submit is suppressed.
 */
export function NaturalVentingCalculator() {
  const form = useForm<NaturalVentingFormInput, unknown, NaturalVentingFormValues>({
    resolver: zodResolver(naturalVentingSchema),
    defaultValues: DEFAULT_NATURAL_VENTING_FORM,
    mode: "onChange",
  });
  const {
    reset,
    setError,
    trigger,
    watch,
    formState: { isDirty },
  } = form;
  const [step, setStep] = useState<StepId>("conditions");
  const [restored, setRestored] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const values = watch();
  const calculation = useNaturalVentingCalculation(values);
  const { generalError, setGeneralError, handleApiError } = useApiFormError(
    setError,
    DEFAULT_NATURAL_VENTING_FORM,
  );

  // Restoring after mount, not during render: the server renders the defaults, so reading storage
  // any earlier would make the first client render disagree with the server's HTML.
  useEffect(() => {
    const draft = loadDraft();
    // keepDefaultValues leaves the blank form as the baseline, so a restored draft still counts as
    // dirty, which is what tells the save effect below that there is something worth keeping.
    if (draft) reset(draft, { keepDefaultValues: true });
    setRestored(true);
  }, [reset]);

  const serialized = JSON.stringify(values);
  const debouncedSerialized = useDebouncedValue(serialized, DRAFT_SAVE_DEBOUNCE_MS);
  useEffect(() => {
    // Before the restore has run the form holds the defaults; writing them would overwrite the
    // very draft that is about to be loaded.
    if (!restored) return;
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
      // Validate every step being left behind, so a jump forward can't skip an incomplete one.
      const fields = STEPS.slice(0, nextIndex).flatMap((passed) => STEP_FIELDS[passed]);
      const valid = await trigger(fields as Path<NaturalVentingFormInput>[]);
      if (!valid) return;
    }
    setStep(next);
    setConfirmingClear(false);
  }

  function clearSavedInputs() {
    clearDraft();
    reset(DEFAULT_NATURAL_VENTING_FORM);
    setGeneralError(null);
    setStep("conditions");
    setConfirmingClear(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <StepNav current={step} onSelect={goTo} />

      <FormErrorBanner message={generalError} />

      <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {currentIndex + 1}. {STEP_LABELS[step]}
        </h2>

        {step === "conditions" && <ConditionsStep form={form} />}
        {step === "zones" && <ZonesStep form={form} />}
        {step === "fires" && <FireCasesStep form={form} />}
        {step === "results" && <ResultsStep state={calculation} />}
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
        Your entries are kept in this browser only, so you can reload without losing them. They are
        never sent anywhere except to run the calculation.
      </p>
    </div>
  );
}
