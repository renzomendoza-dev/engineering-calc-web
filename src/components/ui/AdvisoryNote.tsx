interface AdvisoryNoteProps {
  label: string;
  children: React.ReactNode;
}

/**
 * A small tinted note for field-experience tips that are explicitly NOT a pass/fail or
 * code-compliance result (e.g. conduit fill's "may be difficult to pull" heuristic) —
 * distinct from ResultCard, which is for actual result values, and from a compliance
 * warning box, which reports a rule violation. Always amber/informational, never red/green,
 * so it never reads as a compliance verdict.
 */
export function AdvisoryNote({ label, children }: AdvisoryNoteProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7v.5h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z"
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{label}</p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{children}</p>
      </div>
    </div>
  );
}
