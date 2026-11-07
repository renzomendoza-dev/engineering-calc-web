"use client";

import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { CheckSummary, CheckTable } from "@/components/ui/CheckTable";
import {
  formatCheckValue,
  formatDiameter,
  formatFlow,
  formatFrictionRate,
  formatLength,
  formatPressure,
  formatVelocity,
  formatVolume,
} from "../format";
import { CONNECTION_LABELS, EDITION_NOTICE, INLET_LABELS, ROLE_LABELS } from "../labels";
import { PumpAndStorageSection } from "../PumpAndStorageSection";
import type { StandpipeForm } from "../stepProps";
import type { StandpipeCalculationState } from "../useStandpipeCalculation";

/**
 * Step 3: what the API returned. Nothing is calculated here; the page lays out the response and
 * counts the compliance lines by status.
 */
export function ResultsStep({ state, form }: { state: StandpipeCalculationState; form: StandpipeForm }) {
  const { result, isCalculating, isStale, isComplete } = state;

  if (!result) {
    return (
      <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        {isComplete && isCalculating
          ? "Calculating…"
          : "Complete the earlier steps and the results appear here."}
      </p>
    );
  }

  const dimmed = isStale || isCalculating;

  return (
    <div className={`flex flex-col gap-8 transition-opacity ${dimmed ? "opacity-60" : ""}`}>
      <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        {EDITION_NOTICE}
      </p>

      <HeadlineResult
        label={result.manualSystem ? "Pressure required at the fire department connection" : "Pressure required at the supply"}
        value={formatPressure(
          result.manualSystem && result.highestFdcPressurePsi !== null
            ? result.highestFdcPressurePsi
            : result.pressureAtSupplyPsi,
        )}
        unit="psi"
        secondaryValue={`at ${formatFlow(result.flowAtSupplyGpm)} gpm`}
        note={
          result.manualSystem
            ? result.highestFdcPressurePsi !== null
              ? "What the fire department must pump in at the connection that needs the most, for the flow shown (10.2.6.1.2)."
              : "What the fire department must pump in, for the flow shown (10.2.6.1.2)."
            : "At the base of the riser or the pump discharge, for the flow shown."
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard label="Flow required" value={formatFlow(result.requiredFlowGpm)} unit="gpm" />
        <ResultCard
          label="Flow at the supply"
          value={formatFlow(result.flowAtSupplyGpm)}
          unit="gpm"
          note={
            result.flowAddedAtSupplyGpm > 0
              ? `${formatFlow(result.flowAddedAtSupplyGpm)} gpm of it joins at the supply (${
                  result.flowAddedAtSupplyAutomatic ? "worked out from the flow rules" : "as entered"
                }), as flow only.`
              : "Everything is carried by the path."
          }
        />
        <ResultCard
          label="Friction loss"
          value={formatPressure(result.totalFrictionLossPsi)}
          unit="psi"
          note="Over the whole path."
        />
        <ResultCard
          label="Elevation pressure"
          value={formatPressure(result.totalElevationPsi)}
          unit="psi"
          note="Over the whole path."
        />
        {result.staticPressureAtLowestConnectionPsi !== null && (
          <ResultCard
            label="Static pressure at the lowest hose connection"
            value={formatPressure(result.staticPressureAtLowestConnectionPsi)}
            unit="psi"
            note={
              result.staticPressureAtLowestConnectionPsi > 175
                ? "Above 175 psi: a listed pressure-regulating device is required (10.2.4)."
                : "Not above the 175 psi limit (10.2.4)."
            }
          />
        )}
        <ResultCard
          label="Fire department connection inlets"
          value={result.requiredFdcInlets}
          unit={`x ${INLET_LABELS[result.fdcInletSize]}`}
        />
        <ResultCard
          label="Water supply volume"
          value={formatVolume(result.waterSupplyVolumeGal)}
          unit="gal"
          note={`${formatVolume(result.supplyDurationMinutes)} minutes at the flow at the supply.`}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">How the flow was built up</h3>
        <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {result.demandLines.map((line, index) => (
            <li key={`${line.clause}-${index}`} className="flex justify-between gap-4 border-b border-zinc-100 py-1 dark:border-zinc-900">
              <span>
                <span className="text-zinc-500 dark:text-zinc-400">{line.clause}</span> {line.description}
              </span>
              <span className="tabular-nums whitespace-nowrap">{formatFlow(line.flowGpm)} gpm</span>
            </li>
          ))}
        </ul>
        {result.requiredFlowCapped && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            The standpipe flow was limited to the maximum for the building.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Worksheet</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-3 font-medium">Segment</th>
                <th className="py-2 pr-3 font-medium">Pipe</th>
                <th className="py-2 pr-3 text-right font-medium">Flow (gpm)</th>
                <th className="py-2 pr-3 text-right font-medium">Velocity (ft/s)</th>
                <th className="py-2 pr-3 text-right font-medium">Length + fittings (ft)</th>
                <th className="py-2 pr-3 text-right font-medium">Friction (psi/ft)</th>
                <th className="py-2 pr-3 text-right font-medium">Friction (psi)</th>
                <th className="py-2 pr-3 text-right font-medium">Elevation (psi)</th>
                <th className="py-2 pr-3 text-right font-medium">Remote end (psi)</th>
                <th className="py-2 text-right font-medium">Supply end (psi)</th>
              </tr>
            </thead>
            <tbody>
              {result.segments.map((row) => (
                <tr key={row.label} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                  <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">
                    {row.label}
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {row.hoseConnectionSize
                        ? CONNECTION_LABELS[row.hoseConnectionSize]
                        : row.otherStandpipeConnection
                          ? "Another standpipe's connection point"
                          : ROLE_LABELS[row.role]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                    {row.nominalSize} in., bore {formatDiameter(row.insideDiameterInch)} in., C {row.cFactor}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatFlow(row.flowGpm)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatVelocity(row.velocityFtPerSec)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatLength(row.pipeLengthFt)} + {formatLength(row.fittingsLengthFt)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatFrictionRate(row.frictionPsiPerFt)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatPressure(row.frictionLossPsi)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatPressure(row.elevationPsi)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatPressure(row.pressureAtRemoteEndPsi)}
                    {row.residualRaised && (
                      <span className="block text-xs text-amber-700 dark:text-amber-400">raised to the minimum residual</span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatPressure(row.pressureAtSupplyEndPsi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {result.fdcLines.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fire department connections</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The pressure the fire department must deliver at each connection to supply the flow it carries
            (10.4.1, A.10.4.1). It starts from the pressure required at the supply end of the path.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pr-3 font-medium">Connection</th>
                  <th className="py-2 pr-3 text-right font-medium">Flow (gpm)</th>
                  <th className="py-2 pr-3 text-right font-medium">Friction (psi)</th>
                  <th className="py-2 pr-3 text-right font-medium">Elevation (psi)</th>
                  <th className="py-2 pr-3 text-right font-medium">System end (psi)</th>
                  <th className="py-2 text-right font-medium">At the connection (psi)</th>
                </tr>
              </thead>
              <tbody>
                {result.fdcLines.map((line) => (
                  <tr key={line.label} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                    <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">
                      {line.label}
                      {line.inlets !== null && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {line.inlets} {line.inlets === 1 ? "inlet" : "inlets"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatFlow(line.flowGpm)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatPressure(line.totalFrictionLossPsi)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatPressure(line.totalElevationPsi)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatPressure(line.pressureAtSystemPsi)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatPressure(line.pressureAtFdcPsi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <CheckSummary checks={result.checks} />
        <CheckTable checks={result.checks} formatValue={formatCheckValue} />
      </section>

      {/* A manual system is supplied by the fire department's pumper, so no fire pump is sized for it. */}
      {result.manualSystem ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No fire pump is sized for a manual system: the fire department&apos;s pumper supplies it through the fire
          department connection. A fire pump on a building can serve the sprinkler demand and the inside hose
          requirements only, and is not required to supply the manual wet standpipe demand (A.8.2.1.1).
        </p>
      ) : (
        <PumpAndStorageSection form={form} result={result} />
      )}
    </div>
  );
}
