import { HeadlineResult } from "@/components/ui/HeadlineResult";
import { ResultCard } from "@/components/ui/ResultCard";
import { formatApiText } from "@/lib/apiText";
import { formatNumber } from "./format";
import { LOAD_KIND_LABELS, type GeneratorSetSizingResponse } from "./types";

interface GeneratorSetSizingResultsProps {
  result: GeneratorSetSizingResponse;
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{children}</h3>;
}

function WarningBox({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-500 dark:bg-amber-950/40">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
        {formatApiText(children)}
      </p>
    </div>
  );
}

export function GeneratorSetSizingResults({ result }: GeneratorSetSizingResultsProps) {
  const selected = result.selectedGeneratorKva;
  const conductor = result.outputConductor;
  const firePump = result.firePump;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>

      <HeadlineResult
        label={result.selectedIsUserEntered ? "Generator set checked" : "Recommended standard size"}
        value={selected === null ? "—" : formatNumber(selected, 0)}
        unit={selected === null ? undefined : "kVA"}
        secondaryValue={`Required: ${formatNumber(result.requiredKva)} kVA, ${formatNumber(result.requiredKw)} kW at ${result.generatorPowerFactor} power factor`}
        note={
          result.selectedIsUserEntered
            ? undefined
            : "The next standard size at or above the required kVA. The PEC does not set generator sizes."
        }
      />

      {result.warnings.map((warning) => (
        <WarningBox key={warning}>{warning}</WarningBox>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard label="Connected Load" value={formatNumber(result.connectedKva)} unit="kVA" />
        <ResultCard
          label="Demand Load"
          value={formatNumber(result.demandKva)}
          unit="kVA"
          note={undefined}
        />
        <ResultCard
          label="Demand Current"
          value={formatNumber(result.demandCurrentAmps)}
          unit="A"
        />
        <ResultCard
          label="Required Capacity"
          value={formatNumber(result.requiredKva)}
          unit="kVA"
          note={
            result.startingRequiredKva !== null
              ? result.governingCase === "MOTOR_STARTING"
                ? "Set by motor starting, which needs more than the running load."
                : "Set by the running load; motor starting needs less."
              : result.spareCapacityPercent > 0
                ? `Demand load plus ${formatNumber(result.spareCapacityPercent)}% spare capacity.`
                : undefined
          }
        />
        {result.startingRequiredKva !== null && (
          <>
            <ResultCard
              label="Running Load Requirement"
              value={formatNumber(result.runningRequiredKva)}
              unit="kVA"
              note={undefined}
            />
            <ResultCard
              label="Motor Starting Requirement"
              value={formatNumber(result.startingRequiredKva)}
              unit="kVA"
            />
          </>
        )}
        {result.loadPercentOfSelected !== null && (
          <ResultCard
            label="Demand as a Share of the Set"
            value={formatNumber(result.loadPercentOfSelected)}
            unit="%"
            tone={result.selectedMeetsRequired === false ? "warning" : "default"}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeading>Load schedule</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Load</th>
                <th className="px-3 py-2 text-right font-medium">Connected (VA)</th>
                <th className="px-3 py-2 text-right font-medium">Demand factor</th>
                <th className="px-3 py-2 text-right font-medium">Demand (VA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {result.loadRows.map((row, index) => (
                <tr key={`${row.kind}-${index}`} className="align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {LOAD_KIND_LABELS[row.kind]}
                      {row.continuous ? ", runs 3 hours or more" : ""}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatApiText(row.basis)}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(row.connectedVoltAmperes, 0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(row.demandFactorPercent)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(row.demandVoltAmperes, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.startingSteps.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeading>Motor starting</SectionHeading>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Step</th>
                  <th className="px-3 py-2 font-medium">Starting</th>
                  <th className="px-3 py-2 text-right font-medium">Starting (kVA)</th>
                  <th className="px-3 py-2 text-right font-medium">Already running (kVA)</th>
                  <th className="px-3 py-2 text-right font-medium">Dip limit</th>
                  <th className="px-3 py-2 text-right font-medium">Set for the limit (kVA)</th>
                  <th className="px-3 py-2 text-right font-medium">Dip on the selected set</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.startingSteps.map((step) => (
                  <tr key={step.step} className="align-top">
                    <td className="px-3 py-2 tabular-nums">{step.step}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{step.motors}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(step.startingKva)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(step.runningKvaBefore)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(step.dipLimitPercent)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(step.requiredGeneratorKva)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        step.withinDipLimit === false
                          ? "font-medium text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {step.voltageDipPercentAtSelected === null
                        ? "—"
                        : `${formatNumber(step.voltageDipPercentAtSelected)}%${
                            step.withinDipLimit === false ? " (over the limit)" : ""
                          }`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.startingBasis && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatApiText(result.startingBasis)}
            </p>
          )}
        </div>
      )}

      {firePump && (
        <div className="flex flex-col gap-3">
          <SectionHeading>Fire pump, PEC Article 6.95</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ResultCard
              label="Fire Pump Full-Load Current"
              value={formatNumber(firePump.pumpFullLoadAmps)}
              unit="A"
            />
            {firePump.pumpLockedRotorAmps !== null && (
              <ResultCard
                label="Fire Pump Locked-Rotor Current"
                value={formatNumber(firePump.pumpLockedRotorAmps)}
                unit="A"
              />
            )}
            <ResultCard
              label="Minimum Conductor Ampacity"
              value={formatNumber(firePump.minimumConductorAmpacityAmps)}
              unit="A"
            />
            {firePump.conductor && (
              <ResultCard
                label="Conductors to the Controller"
                value={
                  firePump.conductor.numberOfParallelSets > 1
                    ? `${firePump.conductor.numberOfParallelSets} × ${firePump.conductor.sizeLabel}`
                    : firePump.conductor.sizeLabel
                }
                unit="mm²"
                note={
                  firePump.conductor.upsizedForVoltageDrop
                    ? `Larger than the ${firePump.conductor.ampacitySizeLabel} mm² the ampacity needs, to hold the voltage drop.`
                    : undefined
                }
              />
            )}
            {firePump.cableStartingDropPercent !== null && (
              <ResultCard
                label="Cable Drop at Starting"
                value={formatNumber(firePump.cableStartingDropPercent)}
                unit="%"
              />
            )}
            {firePump.cableRunningDropPercent !== null && (
              <ResultCard
                label="Cable Drop Running at 115%"
                value={formatNumber(firePump.cableRunningDropPercent)}
                unit="%"
                tone={firePump.runningDropWithinLimit === false ? "warning" : "default"}
                note={
                  firePump.runningDropWithinLimit === false
                    ? "Over the 5% allowed (6.95.1.7)."
                    : "Within the 5% allowed (6.95.1.7)."
                }
              />
            )}
            {firePump.controllerStartingDropPercent !== null && (
              <ResultCard
                label="Voltage Drop at the Controller, Starting"
                value={formatNumber(firePump.controllerStartingDropPercent)}
                unit="%"
                tone={firePump.startingDropWithinLimit === false ? "warning" : "default"}
                note={
                  firePump.startingDropWithinLimit === false
                    ? "Over the 15% allowed (6.95.1.7)."
                    : "Within the 15% allowed (6.95.1.7)."
                }
              />
            )}
            {firePump.generatorCurrentPercentOfPumpFla !== null && (
              <ResultCard
                label="Generator Current as a Share of the Pump's"
                value={formatNumber(firePump.generatorCurrentPercentOfPumpFla, 0)}
                unit="%"
                note={
                  firePump.generatorExceedsExceptionLevel
                    ? "Above 225%: 6.95.1.6(C) Exception No. 2 applies to the conductors between the generator and the transfer switch."
                    : "At or below 225%."
                }
              />
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatApiText(firePump.conductorBasis)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatApiText(firePump.voltageDropBasis)}
          </p>
          <ul className="flex flex-col gap-2">
            {firePump.requirements.map((requirement) => (
              <li
                key={`${requirement.citation}-${requirement.text}`}
                className="flex gap-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <span className="w-32 flex-shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                  {requirement.citation}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">{requirement.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <SectionHeading>{`Capacity rule, PEC ${result.capacityCitation}`}</SectionHeading>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.capacityBasis}</p>
      </div>

      {result.loadFeederMinimumAmpacityAmps !== null && (
        <div className="flex flex-col gap-3">
          <SectionHeading>Conductors from the transfer equipment to the loads</SectionHeading>
          <ResultCard
            label="Minimum Ampacity"
            value={formatNumber(result.loadFeederMinimumAmpacityAmps)}
            unit="A"
          />
          {result.loadFeederBasis && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatApiText(result.loadFeederBasis)}
            </p>
          )}
        </div>
      )}

      {result.nameplateCurrentAmps !== null &&
        result.minimumOutputConductorAmpacityAmps !== null && (
          <div className="flex flex-col gap-3">
            <SectionHeading>Generator output circuit, PEC 4.45.1.13</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ResultCard
                label="Nameplate Current"
                value={formatNumber(result.nameplateCurrentAmps)}
                unit="A"
                note={undefined}
              />
              <ResultCard
                label={`Minimum Conductor Ampacity (${formatNumber(result.outputConductorFactor * 100, 0)}% of nameplate)`}
                value={formatNumber(result.minimumOutputConductorAmpacityAmps)}
                unit="A"
              />
              {conductor && (
                <>
                  <ResultCard
                    label="Output Conductor Size"
                    value={
                      conductor.numberOfParallelSets > 1
                        ? `${conductor.numberOfParallelSets} × ${conductor.recommendedSizeLabel}`
                        : conductor.recommendedSizeLabel
                    }
                    unit="mm²"
                    note={
                      conductor.numberOfParallelSets > 1
                        ? "Identical conductors in parallel, each carrying an equal share."
                        : undefined
                    }
                  />
                  <ResultCard
                    label="Derated Ampacity"
                    value={formatNumber(conductor.deratedAmpacityAmps)}
                    unit="A"
                    note={conductor.numberOfParallelSets > 1 ? "Per conductor." : undefined}
                  />
                </>
              )}
            </div>
            {conductor && !conductor.meetsTerminationRating && (
              <WarningBox>
                {`${conductor.recommendedSizeLabel}'s ampacity at the equipment's termination temperature rating does not cover the required load. Consider a larger conductor or a higher-rated termination.`}
              </WarningBox>
            )}
          </div>
        )}

      <div className="flex flex-col gap-3">
        <SectionHeading>Chapter 7 requirements to check</SectionHeading>
        <ul className="flex flex-col gap-2">
          {result.requirements.map((requirement) => (
            <li
              key={`${requirement.citation}-${requirement.text}`}
              className="flex gap-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
            >
              <span className="w-28 flex-shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                {requirement.citation}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{requirement.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatApiText(result.standardSizesNote)} The required capacity is the demand load plus the
        spare capacity you entered; the PEC gives the load calculation, not a generator sizing rule.
      </p>
    </div>
  );
}
