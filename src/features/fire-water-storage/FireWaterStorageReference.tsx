"use client";

import { useFireWaterDurationTable } from "@/hooks/useFireWaterDurationTable";
import { HAZARD_CLASSIFICATION_LABELS } from "./types";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

/**
 * Reference section for the hazard-classification duration table Fire Water Storage's
 * calculation pulls from, so a user can verify a resolved range by hand — mirrors
 * WireSizingReference's pattern (citation + collapsed-by-default table). The form's own
 * instant "requires X-Y minutes" helper text reads a client-side constant instead of this
 * fetched table, to avoid a network round trip before the user has even picked a value.
 */
export function FireWaterStorageReference() {
  const { rows, isLoading, error } = useFireWaterDurationTable();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Reference Table
      </h2>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference table ({error}).
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          NFPA 13 (2019), Table 19.3.3.1.2 — Water Supply Duration Requirements
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Hazard Classification</th>
                  <th className={HEADER_CELL}>Min Duration (min)</th>
                  <th className={HEADER_CELL}>Max Duration (min)</th>
                  <th className={HEADER_CELL}>Hose Stream Allowance (GPM)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.hazardClassification} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className={DATA_CELL}>{HAZARD_CLASSIFICATION_LABELS[row.hazardClassification]}</td>
                    <td className={DATA_CELL}>{row.minMinutes}</td>
                    <td className={DATA_CELL}>{row.maxMinutes}</td>
                    <td className={DATA_CELL}>{row.hoseStreamAllowanceGpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Ordinary and Extra Hazard durations are ranges — NFPA 13 subdivides these classes
        further (e.g. Ordinary Hazard Group 1/2) in ways this summary table doesn&apos;t
        capture. Hose stream allowance is shown for reference only; it is not added to this
        calculator&apos;s storage volume.
      </p>
    </div>
  );
}
