import { UNITS } from "./labels";
import { formatFlow, formatPressure } from "./format";
import type { SprinklerHydraulicResponse } from "./types";

interface SupplyCurveChartProps {
  result: SprinklerHydraulicResponse;
}

/** Inner drawing area, in viewBox units; the SVG scales to whatever width it's given. */
const WIDTH = 640;
const HEIGHT = 340;
const MARGIN = { top: 16, right: 24, bottom: 48, left: 60 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Five ticks spanning 0..max. */
function ticks(max: number): number[] {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * max);
}

/** Axis labels carry no precision of their own — a tick is a position on the scale, not a result. */
function formatAxisTick(value: number, max: number): string {
  const digits = max < 10 ? 1 : 0;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/**
 * The water supply curve, plotted from the sample points the API returns, with the demand point
 * marked on it.
 *
 * The curve is the API's `supplyCurve` list joined point to point — this does not evaluate the
 * supply equation itself, so the line can only ever show what the backend computed. The demand
 * marker, the available pressure at that flow and the margin label are likewise read straight off
 * the response.
 */
export function SupplyCurveChart({ result }: SupplyCurveChartProps) {
  const {
    supplyCurve,
    totalDemandFlowGpm,
    requiredPressureAtSupplyPsi,
    availablePressureAtDemandPsi,
    safetyMarginPsi,
  } = result;

  // No supply means no curve and no margin: there is nothing to plot the demand against, and the
  // caller hides this section entirely. The guard also narrows the nullable figures below.
  if (supplyCurve.length < 2 || availablePressureAtDemandPsi == null || safetyMarginPsi == null) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        There is no supply curve to plot for this calculation.
      </p>
    );
  }

  // Headroom so the demand marker and the curve's own end don't sit on the frame.
  const maxFlow = Math.max(...supplyCurve.map((point) => point.flowGpm), totalDemandFlowGpm) * 1.08;
  const maxPressure =
    Math.max(
      ...supplyCurve.map((point) => point.availablePressurePsi),
      requiredPressureAtSupplyPsi,
    ) * 1.12;

  const x = (flow: number) => MARGIN.left + (flow / maxFlow) * PLOT_WIDTH;
  const y = (pressure: number) => MARGIN.top + PLOT_HEIGHT - (pressure / maxPressure) * PLOT_HEIGHT;

  const curvePath = supplyCurve
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.flowGpm)} ${y(point.availablePressurePsi)}`)
    .join(" ");

  const demandX = x(totalDemandFlowGpm);
  const demandY = y(requiredPressureAtSupplyPsi);
  const availableY = y(availablePressureAtDemandPsi);
  // The label sits left of the marker when the marker is far right, so it stays inside the frame.
  const labelAnchor = demandX > MARGIN.left + PLOT_WIDTH * 0.7 ? "end" : "start";
  const labelX = labelAnchor === "end" ? demandX - 10 : demandX + 10;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="supply-curve-title supply-curve-desc"
      >
        <title id="supply-curve-title">Water supply curve against the system demand</title>
        <desc id="supply-curve-desc">
          {`Supply falls from ${formatPressure(supplyCurve[0].availablePressurePsi)} ${UNITS.pressure} at ${formatFlow(supplyCurve[0].flowGpm)} ${UNITS.flow} to ${formatPressure(supplyCurve[supplyCurve.length - 1].availablePressurePsi)} ${UNITS.pressure} at ${formatFlow(supplyCurve[supplyCurve.length - 1].flowGpm)} ${UNITS.flow}. The demand is ${formatFlow(totalDemandFlowGpm)} ${UNITS.flow} at ${formatPressure(requiredPressureAtSupplyPsi)} ${UNITS.pressure}, where the supply offers ${formatPressure(availablePressureAtDemandPsi)} ${UNITS.pressure}.`}
        </desc>

        {/* Grid and ticks. currentColor-free: Tailwind classes keep both themes legible. */}
        {ticks(maxPressure).map((pressure) => (
          <g key={`p-${pressure}`}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + PLOT_WIDTH}
              y1={y(pressure)}
              y2={y(pressure)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(pressure) + 4}
              textAnchor="end"
              className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
            >
              {formatAxisTick(pressure, maxPressure)}
            </text>
          </g>
        ))}
        {ticks(maxFlow).map((flow) => (
          <text
            key={`f-${flow}`}
            x={x(flow)}
            y={MARGIN.top + PLOT_HEIGHT + 18}
            textAnchor="middle"
            className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
          >
            {formatAxisTick(flow, maxFlow)}
          </text>
        ))}

        {/* Axes */}
        <line
          x1={MARGIN.left}
          x2={MARGIN.left + PLOT_WIDTH}
          y1={MARGIN.top + PLOT_HEIGHT}
          y2={MARGIN.top + PLOT_HEIGHT}
          className="stroke-zinc-400 dark:stroke-zinc-600"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.left}
          x2={MARGIN.left}
          y1={MARGIN.top}
          y2={MARGIN.top + PLOT_HEIGHT}
          className="stroke-zinc-400 dark:stroke-zinc-600"
          strokeWidth={1}
        />
        <text
          x={MARGIN.left + PLOT_WIDTH / 2}
          y={HEIGHT - 8}
          textAnchor="middle"
          className="fill-zinc-600 text-[12px] dark:fill-zinc-400"
        >
          Flow ({UNITS.flow})
        </text>
        <text
          x={14}
          y={MARGIN.top + PLOT_HEIGHT / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${MARGIN.top + PLOT_HEIGHT / 2})`}
          className="fill-zinc-600 text-[12px] dark:fill-zinc-400"
        >
          Pressure ({UNITS.pressure})
        </text>

        {/* The supply curve, and the sample points it was drawn from. */}
        <path
          d={curvePath}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          className="stroke-blue-600 dark:stroke-blue-400"
        />
        {supplyCurve.map((point) => (
          <circle
            key={`${point.flowGpm}-${point.availablePressurePsi}`}
            cx={x(point.flowGpm)}
            cy={y(point.availablePressurePsi)}
            r={2.5}
            className="fill-blue-600 dark:fill-blue-400"
          />
        ))}

        {/* The margin at the demand flow: from what's required up to what's available. */}
        <line
          x1={demandX}
          x2={demandX}
          y1={demandY}
          y2={availableY}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className={result.passes ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-red-600 dark:stroke-red-400"}
        />

        {/* The demand point itself. */}
        <circle
          cx={demandX}
          cy={demandY}
          r={5}
          className={result.passes ? "fill-emerald-600 dark:fill-emerald-400" : "fill-red-600 dark:fill-red-400"}
        />
        <text
          x={labelX}
          y={demandY + 4}
          textAnchor={labelAnchor}
          className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-50"
        >
          {`Demand ${formatFlow(totalDemandFlowGpm)} ${UNITS.flow} @ ${formatPressure(requiredPressureAtSupplyPsi)} ${UNITS.pressure}`}
        </text>
        <text
          x={labelX}
          y={(demandY + availableY) / 2}
          textAnchor={labelAnchor}
          className={
            result.passes
              ? "fill-emerald-700 text-[11px] dark:fill-emerald-400"
              : "fill-red-700 text-[11px] dark:fill-red-400"
          }
        >
          {`Margin ${formatPressure(safetyMarginPsi)} ${UNITS.pressure}`}
        </text>
      </svg>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The line is the {supplyCurve.length} supply curve points returned by the calculation. The
        marked point is the system demand; the dashed line is the margin up to the pressure the
        supply offers at that flow ({formatPressure(availablePressureAtDemandPsi)} {UNITS.pressure}).
      </p>
    </div>
  );
}
