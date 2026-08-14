"use client";

import { useMotorFlcTable } from "@/hooks/useMotorFlcTable";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";
import type { MotorFlcTableRow } from "./types";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

function tableCitation(table: { number: string; title: string; page?: number }): string {
  return `Table ${table.number} — ${table.title}${table.page ? ` (p. ${table.page})` : ""}`;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const PHASE_TABLES = [
  { phaseType: "DC", citation: PEC_TABLES.MOTOR_FLC_DC, showMotorClass: false },
  { phaseType: "SINGLE_PHASE", citation: PEC_TABLES.MOTOR_FLC_SINGLE_PHASE, showMotorClass: false },
  { phaseType: "TWO_PHASE", citation: PEC_TABLES.MOTOR_FLC_TWO_PHASE, showMotorClass: false },
  { phaseType: "THREE_PHASE", citation: PEC_TABLES.MOTOR_FLC_THREE_PHASE, showMotorClass: true },
] as const;

function PhaseTable({
  rows,
  showMotorClass,
  isLoading,
}: {
  rows: MotorFlcTableRow[];
  showMotorClass: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          {showMotorClass && <th className={HEADER_CELL}>Motor Class</th>}
          <th className={HEADER_CELL}>Horsepower</th>
          <th className={HEADER_CELL}>Voltage (V)</th>
          <th className={HEADER_CELL}>FLC (A)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.motorClass}-${row.sizeLabel}-${row.voltage}`}
            className="border-b border-zinc-100 dark:border-zinc-800/50"
          >
            {showMotorClass && (
              <td className={DATA_CELL}>{row.motorClass ? titleCase(row.motorClass) : "—"}</td>
            )}
            <td className={DATA_CELL}>{row.sizeLabel}</td>
            <td className={DATA_CELL}>{row.voltage}</td>
            <td className={DATA_CELL}>{row.flcAmps}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Reference section for motor FLC, mirroring ConduitFillReference's pattern (citation +
 * collapsed-by-default, height-clamped table) rather than VoltageDropFormula's — motor FLC
 * is a pure table lookup with no formula to show.
 *
 * calc-core's MotorFlcTable merges all four PEC Article 4.30 full-load-current tables into
 * one combined lookup and one combined endpoint (useMotorFlcTable fetches that single list),
 * but the display here splits it back out into four separate per-phase tables, each cited
 * against its own PEC table number — grouping happens client-side since every row already
 * carries its phaseType. Motor Class is only shown for the three-phase table, since it's
 * always null for the other three phase types.
 */
export function MotorFlcReference() {
  const { rows, isLoading, error } = useMotorFlcTable();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Full-Load Current Reference
      </h2>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference table ({error}).
        </div>
      )}

      {PHASE_TABLES.map(({ phaseType, citation, showMotorClass }) => (
        <details
          key={phaseType}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {tableCitation(citation)}
          </summary>
          <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
            <PhaseTable
              rows={rows.filter((row) => row.phaseType === phaseType)}
              showMotorClass={showMotorClass}
              isLoading={isLoading}
            />
          </div>
        </details>
      ))}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Source: {PEC_CITATION.bookTitle}, {PEC_CITATION.edition}, published by{" "}
        {PEC_CITATION.publisher}.
      </p>
    </div>
  );
}
