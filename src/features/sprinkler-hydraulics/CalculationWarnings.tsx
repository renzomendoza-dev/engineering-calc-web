import { formatApiText } from "@/lib/apiText";

interface CalculationWarningsProps {
  warnings: string[];
}

/**
 * The response's `warnings` list — things the calculation completed in spite of (an unusual
 * velocity, a figure outside the normal range). Shown as given by the API, never filtered or
 * reworded, and kept visually distinct from the pass/fail verdict: a warning is not a failure.
 *
 * role="status" rather than "alert": these appear while the user is editing, so they should be
 * announced politely rather than interrupting.
 */
export function CalculationWarnings({ warnings }: CalculationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        {warnings.length === 1 ? "Warning from the calculation" : "Warnings from the calculation"}
      </p>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
        {warnings.map((warning) => (
          <li key={warning}>{formatApiText(warning)}</li>
        ))}
      </ul>
    </div>
  );
}
