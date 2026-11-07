import { CHECK_STATUSES, CHECK_STATUS_LABELS, countByStatus, type CheckStatus } from "@/lib/checkStatus";

/** The fields a compliance line has in every calculator's check DTO. */
export interface ComplianceLine {
  clause: string;
  description: string;
  status: CheckStatus;
  actual: number | null;
  limit: number | null;
  unit: string | null;
  note: string | null;
}

const STATUS_CLASSES: Record<CheckStatus, string> = {
  PASS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  FAIL: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  CONFIRM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  INFO: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status]}`}>
      {CHECK_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * The count of the compliance lines by status, above the tables, red when any check fails.
 * `updating` notes that a newer result is on its way.
 */
export function CheckSummary({ checks, updating = false }: { checks: readonly { status: CheckStatus }[]; updating?: boolean }) {
  const counts = countByStatus(checks);
  const hasFail = counts.FAIL > 0;
  return (
    <div
      role="status"
      className={`rounded-lg border p-4 ${
        hasFail
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {hasFail ? `${counts.FAIL} ${counts.FAIL === 1 ? "check fails" : "checks fail"}` : "No check fails"}
        {updating && <span className="ml-2 font-normal text-zinc-500">updating…</span>}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        {CHECK_STATUSES.map((status) => (
          <li key={status}>
            {CHECK_STATUS_LABELS[status]}: <span className="font-semibold tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CheckTableProps<T extends ComplianceLine> {
  checks: readonly T[];
  /** The design and limit figures with their unit, at the precision the calculator shows them. */
  formatValue: (value: number | null, unit: string | null) => string;
  /**
   * A short line under the clause, for example that a check is not a requirement of the standard,
   * so a report built from the table can't present it as one. Null for nothing.
   */
  clauseNote?: (check: T) => string | null;
}

/** The compliance lines the API returned, as given, with the clause each comes from. */
export function CheckTable<T extends ComplianceLine>({ checks, formatValue, clauseNote }: CheckTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pr-3 font-medium">Clause</th>
            <th className="py-2 pr-3 font-medium">Check</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 text-right font-medium">Design</th>
            <th className="py-2 text-right font-medium">Limit</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check, index) => {
            const note = clauseNote?.(check) ?? null;
            return (
              <tr key={`${check.clause}-${index}`} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                <td className="py-2 pr-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                  {check.clause}
                  {note !== null && (
                    <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{note}</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">
                  {check.description}
                  {check.note && (
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{check.note}</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge status={check.status} />
                </td>
                <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">
                  {formatValue(check.actual, check.unit)}
                </td>
                <td className="py-2 text-right whitespace-nowrap tabular-nums">{formatValue(check.limit, check.unit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
