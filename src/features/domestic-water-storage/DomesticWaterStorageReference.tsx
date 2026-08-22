"use client";

import { useDomesticWaterStorageReferenceTables } from "@/hooks/useDomesticWaterStorageReferenceTables";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

function fmt(value: number | null): string {
  return value === null ? "—" : value.toString();
}

/**
 * Reference section for the two tables Domestic Water Storage's two demand-basis modes
 * actually pull from, so a user can verify a recommendation by hand — mirrors
 * WireSizingReference's pattern (citation + collapsed-by-default, height-clamped table).
 *
 * Unlike the electrical domain's PEC_TABLES citation registry, these two tables have
 * genuinely different sources and confidence levels (see reference/storage/README.md), so
 * their citations are written inline here rather than pulled from a shared constant.
 */
export function DomesticWaterStorageReference() {
  const { lpcdRows, wsfuRows, isLoading, error } = useDomesticWaterStorageReferenceTables();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Reference Tables
      </h2>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference tables ({error}).
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          LPCD Consumption by Occupancy Type (used by &quot;By occupant count&quot;)
        </summary>
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Generic international rule-of-thumb figures — not sourced from a confirmed
          Philippine code.
        </p>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Occupancy Type</th>
                  <th className={HEADER_CELL}>LPCD (L/person/day)</th>
                </tr>
              </thead>
              <tbody>
                {lpcdRows.map((row) => (
                  <tr key={row.type} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className={DATA_CELL}>{row.label}</td>
                    <td className={DATA_CELL}>{row.lpcd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          WSFU → Peak Demand, NSPC 2009 Table B.5.4 (used by &quot;By fixture units&quot;)
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>WSFU</th>
                  <th className={HEADER_CELL}>GPM (Flush Tanks)</th>
                  <th className={HEADER_CELL}>GPM (Flush Valves)</th>
                </tr>
              </thead>
              <tbody>
                {wsfuRows.map((row) => (
                  <tr key={row.wsfu} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className={DATA_CELL}>{row.wsfu}</td>
                    <td className={DATA_CELL}>{row.gpmFlushTanks}</td>
                    <td className={DATA_CELL}>{fmt(row.gpmFlushValves)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        WSFU table cross-validated against a real worked example from the Revised National
        Plumbing Code of the Philippines (Annex A) — see reference/storage/README.md.
      </p>
    </div>
  );
}
