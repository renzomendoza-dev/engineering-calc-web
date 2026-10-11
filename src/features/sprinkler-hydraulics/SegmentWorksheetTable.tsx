import { UNITS } from "./labels";
import {
  formatDiameter,
  formatFlow,
  formatFrictionRate,
  formatLength,
  formatNominalSize,
  formatPlain,
  formatPressure,
  formatVelocity,
} from "./format";
import type { SegmentFlowRow } from "./types";

const HEADER_CELL = "whitespace-nowrap py-2 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-2 pr-4 tabular-nums last:pr-0";

interface SegmentWorksheetTableProps {
  segments: SegmentFlowRow[];
}

/**
 * The hydraulic calculation sheet: one row per pipe segment, exactly as the API returned them, in
 * the order it returned them (most remote sprinkler first, working back to the supply).
 *
 * Every cell is a field of SegmentFlowRow. Nothing is summed, averaged or carried between rows —
 * the end pressure of one row is the API's, not this table's running total — so the sheet can be
 * checked against the response one field at a time.
 *
 * Fifteen columns never fit a phone, so the table scrolls horizontally inside its own container
 * rather than widening the page.
 */
export function SegmentWorksheetTable({ segments }: SegmentWorksheetTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
          <caption className="sr-only">
            Friction loss worksheet, one row per pipe segment, from the most remote sprinkler back
            to the water supply.
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th scope="col" className={HEADER_CELL}>
                From
              </th>
              <th scope="col" className={HEADER_CELL}>
                To
              </th>
              <th scope="col" className={HEADER_CELL}>
                Flow ({UNITS.flow})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Size
              </th>
              <th scope="col" className={HEADER_CELL}>
                Inside dia. ({UNITS.diameter})
              </th>
              <th scope="col" className={HEADER_CELL}>
                C
              </th>
              <th scope="col" className={HEADER_CELL}>
                Pipe ({UNITS.length})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Fittings ({UNITS.length})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Total ({UNITS.length})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Friction ({UNITS.pressure}/{UNITS.length})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Friction ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Elevation ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                End pressure ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Velocity ({UNITS.velocity})
              </th>
            </tr>
          </thead>
          <tbody>
            {segments.map((row) => (
              <tr
                key={`${row.fromNodeId}->${row.toNodeId}`}
                className="border-b border-zinc-100 dark:border-zinc-800/50"
              >
                <th scope="row" className={`${DATA_CELL} font-medium`}>
                  {row.fromNodeId}
                </th>
                <td className={DATA_CELL}>{row.toNodeId}</td>
                <td className={DATA_CELL}>{formatFlow(row.flowGpm)}</td>
                <td className={DATA_CELL}>{formatNominalSize(row.nominalSize)}</td>
                <td className={DATA_CELL}>{formatDiameter(row.insideDiameterInch)}</td>
                <td className={DATA_CELL}>{formatPlain(row.cFactor)}</td>
                <td className={DATA_CELL}>{formatLength(row.pipeLengthFt)}</td>
                <td className={DATA_CELL}>{formatLength(row.fittingEquivalentLengthFt)}</td>
                <td className={DATA_CELL}>{formatLength(row.totalLengthFt)}</td>
                <td className={DATA_CELL}>{formatFrictionRate(row.frictionLossPsiPerFoot)}</td>
                <td className={DATA_CELL}>{formatPressure(row.frictionLossPsi)}</td>
                <td className={DATA_CELL}>{formatPressure(row.elevationPressurePsi)}</td>
                <td className={`${DATA_CELL} font-medium text-zinc-900 dark:text-zinc-50`}>
                  {formatPressure(row.endPressurePsi)}
                </td>
                <td className={DATA_CELL}>{formatVelocity(row.velocityFps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Scroll sideways for the remaining columns. &ldquo;End pressure&rdquo; is the pressure at
        that segment&apos;s downstream node; any device losses are added after the last row to give
        the pressure required at the supply.
      </p>
    </div>
  );
}
