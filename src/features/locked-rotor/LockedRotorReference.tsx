"use client";

import { useLockedRotorTables } from "@/hooks/useLockedRotorTables";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";
import type { LockedRotorTableRow } from "./types";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

function tableCitation(table: { number: string; title: string; page?: number }): string {
  return `Table ${table.number} — ${table.title}${table.page ? ` (p. ${table.page})` : ""}`;
}

function LockedRotorTable({
  rows,
  isLoading,
}: {
  rows: LockedRotorTableRow[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className={HEADER_CELL}>Horsepower</th>
          <th className={HEADER_CELL}>Voltage (V)</th>
          <th className={HEADER_CELL}>Locked-Rotor Current (A)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.sizeLabel}-${row.voltage}`}
            className="border-b border-zinc-100 dark:border-zinc-800/50"
          >
            <td className={DATA_CELL}>{row.sizeLabel}</td>
            <td className={DATA_CELL}>{row.voltage}</td>
            <td className={DATA_CELL}>{row.lockedRotorAmps}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Reference section for locked rotor, mirroring ConduitFillReference/MotorFlcReference's
 * pattern (citation + collapsed-by-default, height-clamped table) — no formula to show,
 * just the two underlying PEC tables. Single-phase and polyphase are genuinely separate
 * source tables in calc-core (not merged, unlike motor FLC), so they're shown as two
 * separate collapsible sections.
 */
export function LockedRotorReference() {
  const { singlePhaseRows, polyphaseRows, isLoading, error } = useLockedRotorTables();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Locked-Rotor Current Reference
      </h2>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference tables ({error}).
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.LOCKED_ROTOR_SINGLE_PHASE)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          <LockedRotorTable rows={singlePhaseRows} isLoading={isLoading} />
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.LOCKED_ROTOR_POLYPHASE)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          <LockedRotorTable rows={polyphaseRows} isLoading={isLoading} />
        </div>
      </details>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Source: {PEC_CITATION.bookTitle}, {PEC_CITATION.edition}, published by{" "}
        {PEC_CITATION.publisher}.
      </p>
    </div>
  );
}
