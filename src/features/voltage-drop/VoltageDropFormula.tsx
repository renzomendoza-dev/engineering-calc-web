"use client";

import { FormulaBlock } from "@/components/ui/FormulaBlock";
import { useConductorReferenceTables } from "@/hooks/useConductorReferenceTables";
import { PEC_CITATION, PEC_TABLES } from "@/lib/pec-reference";

const HEADER_CELL = "whitespace-nowrap py-1 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-1 pr-4 last:pr-0";

function formatOhms(value: number | null): string {
  return value === null ? "—" : String(value);
}

/**
 * Shows all three circuit-type formula variants at once (rather than only the one
 * matching the current form selection) — this avoids lifting circuitType state out of
 * VoltageDropForm just to drive a highlight here, and is the smaller amount of code for
 * a reference block that's mostly read once, not re-read on every field change.
 */
export function VoltageDropFormula() {
  const { impedanceRows, dcResistanceRows, isLoading, error } = useConductorReferenceTables();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="DC" tex="V_d = 2 \cdot L \cdot I \cdot \frac{R}{N}" />
        <FormulaBlock
          label="Single-Phase AC"
          tex="V_d = 2 \cdot L \cdot I \cdot \left(\frac{R}{N}\cos\theta + \frac{X}{N}\sin\theta\right)"
        />
        <FormulaBlock
          label="Three-Phase AC"
          tex="V_d = \sqrt{3} \cdot L \cdot I \cdot \left(\frac{R}{N}\cos\theta + \frac{X}{N}\sin\theta\right)"
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        V_d = voltage drop (V), L = one-way length (m), I = current (A), R/X = resistance /
        reactance per meter (Ω/m), N = parallel sets per phase, cos θ = power factor.
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        R and X, when resolved from PEC reference tables rather than entered manually, are
        sourced from {PEC_CITATION.bookTitle} ({PEC_CITATION.edition}), published by{" "}
        {PEC_CITATION.publisher}: Table {PEC_TABLES.DC_RESISTANCE.number} (
        {PEC_TABLES.DC_RESISTANCE.title}, p. {PEC_TABLES.DC_RESISTANCE.page}) for DC, and Table{" "}
        {PEC_TABLES.AC_RESISTANCE_REACTANCE.number} ({PEC_TABLES.AC_RESISTANCE_REACTANCE.title},
        p. {PEC_TABLES.AC_RESISTANCE_REACTANCE.page}) for AC.
      </p>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Couldn&apos;t load the reference tables ({error}).
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Table {PEC_TABLES.DC_RESISTANCE.number} — {PEC_TABLES.DC_RESISTANCE.title} (p.{" "}
          {PEC_TABLES.DC_RESISTANCE.page})
        </summary>
        <div className="mt-3 overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Size (mm²)</th>
                  <th className={HEADER_CELL}>Stranded</th>
                  <th className={HEADER_CELL}>Strands</th>
                  <th className={HEADER_CELL}>Cu Uncoated (Ω/305m)</th>
                  <th className={HEADER_CELL}>Cu Coated (Ω/305m)</th>
                  <th className={HEADER_CELL}>Aluminum (Ω/305m)</th>
                </tr>
              </thead>
              <tbody>
                {dcResistanceRows.map((row) => (
                  <tr
                    key={`${row.sizeLabel}-${row.stranded}`}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className={DATA_CELL}>{row.sizeLabel}</td>
                    <td className={DATA_CELL}>{row.stranded ? "Yes" : "No"}</td>
                    <td className={DATA_CELL}>{row.strandCount}</td>
                    <td className={DATA_CELL}>{row.copperUncoatedOhmsPer305m}</td>
                    <td className={DATA_CELL}>{row.copperCoatedOhmsPer305m}</td>
                    <td className={DATA_CELL}>{row.aluminumOhmsPer305m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Table {PEC_TABLES.AC_RESISTANCE_REACTANCE.number} —{" "}
          {PEC_TABLES.AC_RESISTANCE_REACTANCE.title} (p. {PEC_TABLES.AC_RESISTANCE_REACTANCE.page})
        </summary>
        <div className="mt-3 overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : (
            <table className="min-w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className={HEADER_CELL}>Size (mm²)</th>
                  <th className={HEADER_CELL}>XL PVC/Al Conduit</th>
                  <th className={HEADER_CELL}>XL Steel Conduit</th>
                  <th className={HEADER_CELL}>R Cu / PVC</th>
                  <th className={HEADER_CELL}>R Cu / Al Conduit</th>
                  <th className={HEADER_CELL}>R Cu / Steel</th>
                  <th className={HEADER_CELL}>R Al / PVC</th>
                  <th className={HEADER_CELL}>R Al / Al Conduit</th>
                  <th className={HEADER_CELL}>R Al / Steel</th>
                </tr>
              </thead>
              <tbody>
                {impedanceRows.map((row) => (
                  <tr key={row.sizeLabel} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className={DATA_CELL}>{row.sizeLabel}</td>
                    <td className={DATA_CELL}>{row.reactancePvcAluminumConduitOhmsPer305m}</td>
                    <td className={DATA_CELL}>{row.reactanceSteelConduitOhmsPer305m}</td>
                    <td className={DATA_CELL}>{formatOhms(row.resistanceCopperPvcOhmsPer305m)}</td>
                    <td className={DATA_CELL}>
                      {formatOhms(row.resistanceCopperAluminumConduitOhmsPer305m)}
                    </td>
                    <td className={DATA_CELL}>{formatOhms(row.resistanceCopperSteelOhmsPer305m)}</td>
                    <td className={DATA_CELL}>
                      {formatOhms(row.resistanceAluminumWirePvcOhmsPer305m)}
                    </td>
                    <td className={DATA_CELL}>
                      {formatOhms(row.resistanceAluminumWireAluminumConduitOhmsPer305m)}
                    </td>
                    <td className={DATA_CELL}>
                      {formatOhms(row.resistanceAluminumWireSteelOhmsPer305m)}
                    </td>
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
