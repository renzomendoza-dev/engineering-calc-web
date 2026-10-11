"use client";

import { STEPS, STEP_LABELS, type StepId } from "./schema";

interface StepNavProps {
  current: StepId;
  /** Which steps have been validated and passed, so a jump forward can be allowed or blocked. */
  onSelect: (step: StepId) => void;
}

/**
 * The five-step indicator. Each step is a button: going back is always allowed, and going forward
 * runs the current step's validation first (handled by the parent), so the user can move around
 * without losing anything they've typed.
 */
export function StepNav({ current, onSelect }: StepNavProps) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav aria-label="Calculation steps">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = step === current;
          const isPast = index < currentIndex;
          return (
            <li key={step}>
              <button
                type="button"
                onClick={() => onSelect(step)}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300"
                    : isPast
                      ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {index + 1}
                </span>
                {STEP_LABELS[step]}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
