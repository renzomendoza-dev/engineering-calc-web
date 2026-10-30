import {
  BASIS_LABELS,
  STATUS_LABELS,
  formatCheckValue,
} from "./format";
import type { CheckStatus, VentingCheck } from "./types";

const STATUS_CLASSES: Record<CheckStatus, string> = {
  PASS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  FAIL: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  CONFIRM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  INFO: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * The compliance lines the API returned, as given. A line that is not a requirement of NFPA 204
 * says so under its clause, so a report built from this can't present it as one.
 */
export function CheckTable({ checks }: { checks: VentingCheck[] }) {
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
          {checks.map((check, index) => (
            <tr
              key={`${check.clause}-${index}`}
              className="border-b border-zinc-100 align-top dark:border-zinc-900"
            >
              <td className="py-2 pr-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                {check.clause}
                {check.basis === "SUPPLEMENTARY" && (
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
                    {BASIS_LABELS[check.basis]}
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">
                {check.description}
                {check.note && (
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    {check.note}
                  </span>
                )}
              </td>
              <td className="py-2 pr-3">
                <StatusBadge status={check.status} />
              </td>
              <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">
                {formatCheckValue(check.actual, check.unit)}
              </td>
              <td className="py-2 text-right whitespace-nowrap tabular-nums">
                {formatCheckValue(check.limit, check.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
