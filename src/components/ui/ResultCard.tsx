interface ResultCardProps {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "default" | "warning";
  note?: string;
}

/**
 * Displays a single labeled result value. Reused across every calculator's results panel.
 * `tone="warning"` is for values that breach a recommended limit (e.g. voltage drop > 3%).
 */
export function ResultCard({ label, value, unit, tone = "default", note }: ResultCardProps) {
  const isWarning = tone === "warning";

  return (
    <div
      className={`rounded-lg border p-4 ${
        isWarning
          ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          isWarning ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-base font-normal text-zinc-500">{unit}</span>}
      </p>
      {note && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{note}</p>
      )}
    </div>
  );
}
