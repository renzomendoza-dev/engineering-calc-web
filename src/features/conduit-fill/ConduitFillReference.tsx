"use client";

import { useConduitFillDimensionTables } from "@/hooks/useConduitFillDimensionTables";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

/** Mirrors calc-core's FillPercentageRule constants — only three values, hardcoded there
 * too (not JSON-backed), so hardcoding the same three here isn't a reference-data drift
 * risk the way conductor/conduit dimensions would be. */
const FILL_PERCENTAGE_RULE = [
  { conductorCount: "1", allowedPercent: 53 },
  { conductorCount: "2", allowedPercent: 31 },
  { conductorCount: "3 or more", allowedPercent: 40 },
];

function tableCitation(table: { number: string; title: string; page?: number }): string {
  return `Table ${table.number} — ${table.title}${table.page ? ` (p. ${table.page})` : ""}`;
}

/**
 * Reference section for conduit fill, mirroring VoltageDropFormula's pattern: a small
 * always-visible reference table for the fixed fill-percentage rule, plus the two large
 * PEC tables backing the calculation shown collapsed-by-default. Those two are far bigger
 * than voltage drop's reference tables (hundreds of rows for conductor dimensions across 49
 * insulation types), so their scroll containers are height-clamped as well as width-clamped.
 */
export function ConduitFillReference() {
  const { conductorDimensionRows, conduitDimensionRows, isLoading, error } =
    useConduitFillDimensionTables();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Fill Reference
      </h2>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Allowed Fill Percentage
        </p>
        <table className="mt-2 text-left text-xs text-zinc-700 dark:text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className={HEADER_CELL}>Conductors in Conduit</th>
              <th className={HEADER_CELL}>Allowed Fill</th>
            </tr>
          </thead>
          <tbody>
            {FILL_PERCENTAGE_RULE.map((row) => (
              <tr key={row.conductorCount} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <td className={DATA_CELL}>{row.conductorCount}</td>
                <td className={DATA_CELL}>{row.allowedPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Source: {PEC_CITATION.bookTitle}, {PEC_CITATION.edition} —{" "}
          {tableCitation(PEC_TABLES.FILL_PERCENTAGE)}.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference tables ({error}).
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.CONDUIT_DIMENSIONS)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Conduit Type</th>
                  <th className={HEADER_CELL}>Raceway Size (mm)</th>
                  <th className={HEADER_CELL}>1 Wire 53% (mm²)</th>
                  <th className={HEADER_CELL}>2 Wires 53% (mm²)</th>
                  <th className={HEADER_CELL}>Over 2 Wires 40% (mm²)</th>
                  <th className={HEADER_CELL}>60% (mm²)</th>
                  <th className={HEADER_CELL}>Nominal ID (mm)</th>
                  <th className={HEADER_CELL}>Total Area 100% (mm²)</th>
                </tr>
              </thead>
              <tbody>
                {conduitDimensionRows.map((row) => (
                  <tr
                    key={`${row.conduitType}-${row.racewaySizeMm}`}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className={DATA_CELL}>{row.conduitType}</td>
                    <td className={DATA_CELL}>{row.racewaySizeMm}</td>
                    <td className={DATA_CELL}>{row.oneWire53PercentMm2}</td>
                    <td className={DATA_CELL}>{row.twoWires53PercentMm2}</td>
                    <td className={DATA_CELL}>{row.over2Wires40PercentMm2}</td>
                    <td className={DATA_CELL}>{row.sixtyPercentMm2}</td>
                    <td className={DATA_CELL}>{row.nominalInternalDiameterMm}</td>
                    <td className={DATA_CELL}>{row.totalArea100PercentMm2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.CONDUCTOR_DIMENSIONS)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Insulation Type</th>
                  <th className={HEADER_CELL}>Size (mm²)</th>
                  <th className={HEADER_CELL}>Without Outer Covering</th>
                  <th className={HEADER_CELL}>Approx. Area (mm²)</th>
                  <th className={HEADER_CELL}>Approx. Diameter (mm)</th>
                </tr>
              </thead>
              <tbody>
                {conductorDimensionRows.map((row) => (
                  <tr
                    key={`${row.insulationType}-${row.sizeLabel}-${row.withoutOuterCovering}`}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className={DATA_CELL}>{row.insulationType}</td>
                    <td className={DATA_CELL}>{row.sizeLabel}</td>
                    <td className={DATA_CELL}>{row.withoutOuterCovering ? "Yes" : "No"}</td>
                    <td className={DATA_CELL}>{row.approximateAreaMm2}</td>
                    <td className={DATA_CELL}>{row.approximateDiameterMm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>
    </div>
  );
}
