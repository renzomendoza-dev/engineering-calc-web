"use client";

import { UNITS } from "./labels";
import { formatFlow, formatPercent, formatPressure } from "./format";
import type { SprinklerCalculationState } from "./useSprinklerCalculation";

interface DemandSummaryPanelProps {
  state: SprinklerCalculationState;
  /** True once the user has reached the last step, where the panel's figures are repeated in full. */
  hasError: boolean;
}

function PassBadge({ passes }: { passes: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        passes
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      }`}
    >
      {passes ? "Supply is adequate" : "Supply is inadequate"}
    </span>
  );
}

/** One short line saying whether what's on screen is current, being recalculated, or waiting. */
function statusText(state: SprinklerCalculationState, hasError: boolean): string | null {
  if (state.isCalculating) return "Calculating…";
  if (hasError) return "Calculation failed";
  if (!state.isComplete) return state.result ? "Waiting for complete input" : "Fill in the steps to calculate";
  if (state.isStale) return "Input changed — updating";
  return null;
}

/**
 * Whether the result answers "does the supply meet the demand".
 *
 * A calculation run with no water supply returns null for the margin and the verdict: the demand
 * figures are complete, but nothing was compared against them. That is not a failure, so nothing
 * red is shown for it -- the panel simply says what it does and doesn't know.
 */
function hasVerdict(result: SprinklerCalculationState["result"]): boolean {
  return result?.passes != null;
}

/**
 * The running result, visible on every step: a sidebar on large screens, a compact fixed bar on
 * small ones. Every figure is the API's; nothing is recomputed here, and nothing is shown unless
 * a response produced it.
 *
 * While the input is incomplete or being edited, the last response stays on screen but is dimmed
 * and labelled, so a stale number can't be mistaken for the current one.
 */
export function DemandSummaryPanel({ state, hasError }: DemandSummaryPanelProps) {
  const { result, isStale, isComplete } = state;
  const status = statusText(state, hasError);
  const dimmed = result !== null && (isStale || !isComplete);
  const verdict = hasVerdict(result);

  return (
    <>
      {/* Large screens: sticky sidebar. */}
      <aside
        aria-label="Demand summary"
        className="hidden lg:sticky lg:top-6 lg:block lg:w-80 lg:flex-none"
      >
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Demand summary</h2>
            {result && verdict && !dimmed && <PassBadge passes={result.passes!} />}
          </div>

          {status && (
            <p
              className={`text-xs ${
                hasError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {status}
            </p>
          )}

          {result ? (
            <dl className={`flex flex-col gap-3 text-sm ${dimmed ? "opacity-50" : ""}`}>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Total demand flow</dt>
                <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatFlow(result.totalDemandFlowGpm)}{" "}
                  <span className="text-sm font-normal text-zinc-500">{UNITS.flow}</span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Required pressure at the supply</dt>
                <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatPressure(result.requiredPressureAtSupplyPsi)}{" "}
                  <span className="text-sm font-normal text-zinc-500">{UNITS.pressure}</span>
                </dd>
              </div>
              {verdict ? (
                <>
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Available pressure at that flow
                    </dt>
                    <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatPressure(result.availablePressureAtDemandPsi!)}{" "}
                      <span className="text-sm font-normal text-zinc-500">{UNITS.pressure}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Safety margin</dt>
                    <dd
                      className={`text-lg font-semibold ${
                        result.passes
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {formatPressure(result.safetyMarginPsi!)}{" "}
                      <span className="text-sm font-normal text-zinc-500">{UNITS.pressure}</span>
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        ({formatPercent(result.safetyMarginPercent!)}%)
                      </span>
                    </dd>
                  </div>
                  {dimmed && <PassBadge passes={result.passes!} />}
                </>
              ) : (
                // Only while the result is current: once the input has changed this describes a
                // supply choice the user may have just left, and would contradict the status line.
                !dimmed && (
                  <div className="rounded-md border border-zinc-200 p-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    No water supply given, so there is no margin or verdict — the demand above is
                    what a pump or supply has to meet.
                  </div>
                )
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The result appears here as soon as every required figure is filled in, and updates as
              you edit.
            </p>
          )}
        </div>
      </aside>

      {/* Small screens: compact bar, kept clear of the unit-converter button on the right. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center gap-4 overflow-x-auto px-4 py-2 pr-20">
          {result ? (
            <>
              <div className={`flex-none ${dimmed ? "opacity-50" : ""}`}>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Demand</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatFlow(result.totalDemandFlowGpm)} {UNITS.flow}
                </p>
              </div>
              <div className={`flex-none ${dimmed ? "opacity-50" : ""}`}>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Required</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatPressure(result.requiredPressureAtSupplyPsi)} {UNITS.pressure}
                </p>
              </div>
              {verdict ? (
                <>
                  <div className={`flex-none ${dimmed ? "opacity-50" : ""}`}>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Margin</p>
                    <p
                      className={`text-sm font-semibold ${
                        result.passes
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {formatPressure(result.safetyMarginPsi!)} {UNITS.pressure}
                    </p>
                  </div>
                  <div className={`flex-none ${dimmed ? "opacity-50" : ""}`}>
                    <PassBadge passes={result.passes!} />
                  </div>
                </>
              ) : (
                <p className="flex-none text-[11px] text-zinc-500 dark:text-zinc-400">
                  No supply — demand only
                </p>
              )}
            </>
          ) : (
            <p className="flex-none text-xs text-zinc-500 dark:text-zinc-400">
              No result yet — fill in the steps.
            </p>
          )}
          {status && (
            <p
              className={`flex-none text-[11px] ${
                hasError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
