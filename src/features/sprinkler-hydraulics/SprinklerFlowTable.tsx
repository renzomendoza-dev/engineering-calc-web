import { formatFlow, formatPlain, formatPressure } from "./format";
import { UNITS } from "./labels";
import { describeSprinklerNode } from "./network";
import type { SprinklerFlowRow } from "./types";

const HEADER_CELL = "whitespace-nowrap py-2 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-2 pr-4 tabular-nums last:pr-0";

interface SprinklerFlowTableProps {
  rows: SprinklerFlowRow[];
}

/**
 * What each listed sprinkler discharges, as the API returned them, most remote first.
 *
 * Only the most remote sprinkler is held at its minimum. The others discharge at the pressure the
 * network gives them -- Q = K x sqrt(P) -- so they flow more, and a sprinkler on a branch that was
 * balanced at a junction flows more again. Every cell is a field of SprinklerFlowRow.
 */
export function SprinklerFlowTable({ rows }: SprinklerFlowTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
          <caption className="sr-only">
            What each listed sprinkler discharges and at what pressure, from the most remote
            sprinkler back toward the supply.
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th scope="col" className={HEADER_CELL}>
                Sprinkler
              </th>
              <th scope="col" className={HEADER_CELL}>
                K
              </th>
              <th scope="col" className={HEADER_CELL}>
                Pressure ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Flow ({UNITS.flow})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Minimum ({UNITS.flow})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.nodeId} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <th scope="row" className={`${DATA_CELL} font-medium`}>
                  {describeSprinklerNode(row.nodeId) ?? row.nodeId}
                </th>
                <td className={DATA_CELL}>{formatPlain(row.kFactor)}</td>
                <td className={DATA_CELL}>{formatPressure(row.pressurePsi)}</td>
                <td className={`${DATA_CELL} font-medium text-zinc-900 dark:text-zinc-50`}>
                  {formatFlow(row.flowGpm)}
                </td>
                <td className={DATA_CELL}>{formatFlow(row.minimumFlowGpm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Only the most remote sprinkler is held at the minimum the design density asks for. The rest
        discharge at the pressure the network gives them, so they flow more; a sprinkler on a branch
        that was balanced at a junction flows more again. Sprinklers an identical branch stands for
        are not listed here — that branch is one line in the table below.
      </p>
    </div>
  );
}
