"use client";

import { useWireSizingReferenceTables } from "@/hooks/useWireSizingReferenceTables";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";
import type {
  AmbientTempCorrectionTableRow,
  AmpacityTableRow,
  ConductorCountAdjustmentTableRow,
  InsulationTypeTempRatingTableRow,
} from "./types";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

function tableCitation(table: { number: string; title: string; page?: number }): string {
  return `Table ${table.number} — ${table.title}${table.page ? ` (p. ${table.page})` : ""}`;
}

function fmt(value: number | null): string {
  return value === null ? "—" : value.toString();
}

function AmpacityRows({ rows }: { rows: AmpacityTableRow[] }) {
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className={HEADER_CELL}>Material</th>
          <th className={HEADER_CELL}>Size</th>
          <th className={HEADER_CELL}>Temp Rating (°C)</th>
          <th className={HEADER_CELL}>Ampacity (A)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.conductorMaterial}-${row.sizeLabel}-${row.tempRatingCelsius}`}
            className="border-b border-zinc-100 dark:border-zinc-800/50"
          >
            <td className={DATA_CELL}>{row.conductorMaterial}</td>
            <td className={DATA_CELL}>{row.sizeLabel}</td>
            <td className={DATA_CELL}>{row.tempRatingCelsius}</td>
            <td className={DATA_CELL}>{row.ampacityAmps}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InsulationTempRatingRows({ rows }: { rows: InsulationTypeTempRatingTableRow[] }) {
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className={HEADER_CELL}>Insulation Type</th>
          <th className={HEADER_CELL}>Material</th>
          <th className={HEADER_CELL}>Temp Rating (°C)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            // Dual-rated insulations (e.g. THHW, XHHW: 75 °C wet, 90 °C dry) have one row per
            // rating for the same type/material, so the rating is part of the identity.
            key={`${row.insulationType}-${row.conductorMaterial}-${row.tempRatingCelsius}`}
            className="border-b border-zinc-100 dark:border-zinc-800/50"
          >
            <td className={DATA_CELL}>{row.insulationType}</td>
            <td className={DATA_CELL}>{row.conductorMaterial}</td>
            <td className={DATA_CELL}>{row.tempRatingCelsius}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AmbientTempCorrectionRows({ rows }: { rows: AmbientTempCorrectionTableRow[] }) {
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className={HEADER_CELL}>Ambient (°C)</th>
          <th className={HEADER_CELL}>60°C Factor</th>
          <th className={HEADER_CELL}>75°C Factor</th>
          <th className={HEADER_CELL}>90°C Factor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ambientTempRangeLabel} className="border-b border-zinc-100 dark:border-zinc-800/50">
            <td className={DATA_CELL}>{row.ambientTempRangeLabel}</td>
            <td className={DATA_CELL}>{fmt(row.factor60C)}</td>
            <td className={DATA_CELL}>{fmt(row.factor75C)}</td>
            <td className={DATA_CELL}>{fmt(row.factor90C)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConductorCountAdjustmentRows({ rows }: { rows: ConductorCountAdjustmentTableRow[] }) {
  return (
    <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className={HEADER_CELL}>Current-Carrying Conductors</th>
          <th className={HEADER_CELL}>Adjustment Factor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.conductorCountRangeLabel} className="border-b border-zinc-100 dark:border-zinc-800/50">
            <td className={DATA_CELL}>{row.conductorCountRangeLabel}</td>
            <td className={DATA_CELL}>{row.adjustmentFactorPercent}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Reference section for the four tables WireSizingCalculator's core ampacity/derating
 * sequence actually pulls from (ampacity, insulation-temp-rating, ambient-temp-correction,
 * conductor-count-adjustment) — so a user can verify a recommendation by hand. Mirrors
 * MotorFlcReference's pattern (citation + collapsed-by-default, height-clamped table) rather
 * than VoltageDropFormula's, since this is a pure table lookup with no formula to show.
 *
 * Deliberately scoped to these four — not the voltage-drop check's own reference tables
 * (conductor impedance / DC resistance), which are that optional sub-feature's data, already
 * shown on the Voltage Drop calculator's own page.
 */
export function WireSizingReference() {
  const {
    ampacityRows,
    insulationTempRatingRows,
    ambientTempCorrectionRows,
    conductorCountAdjustmentRows,
    isLoading,
    error,
  } = useWireSizingReferenceTables();

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
          {tableCitation(PEC_TABLES.AMPACITY)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <AmpacityRows rows={ampacityRows} />
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.INSULATION_TEMP_RATING)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <InsulationTempRatingRows rows={insulationTempRatingRows} />
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.AMBIENT_TEMP_CORRECTION)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <AmbientTempCorrectionRows rows={ambientTempCorrectionRows} />
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tableCitation(PEC_TABLES.CONDUCTOR_COUNT_ADJUSTMENT)}
        </summary>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <ConductorCountAdjustmentRows rows={conductorCountAdjustmentRows} />
          )}
        </div>
      </details>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Source: {PEC_CITATION.bookTitle}, {PEC_CITATION.edition}, published by{" "}
        {PEC_CITATION.publisher}.
      </p>
    </div>
  );
}
