import { formatAdjustment, formatFlow, formatPressure } from "./format";
import { UNITS } from "./labels";
import { branchIndexOfNode } from "./network";
import type { IdenticalBranchRow } from "./types";

const HEADER_CELL = "whitespace-nowrap py-2 pr-4 font-medium last:pr-0";
const DATA_CELL = "whitespace-nowrap py-2 pr-4 tabular-nums last:pr-0";

/** "Branch 2" for a node this form generated; the node's own id for anything else. */
function branchName(nodeId: string): string {
  const index = branchIndexOfNode(nodeId);
  return index === null ? nodeId : `Branch ${index + 1}`;
}

interface IdenticalBranchTableProps {
  rows: IdenticalBranchRow[];
}

/**
 * The branches declared identical to another, one line each, as the API returned them.
 *
 * They have no rows in the friction loss worksheet because their pipes were never listed: each is
 * the reference branch's own result, scaled to the pressure at its own junction. This line is the
 * whole of that scaling, laid out so it can be checked by hand --
 * flow = reference flow x the square root of (junction pressure / reference pressure) -- and every
 * figure in it is the API's.
 */
export function IdenticalBranchTable({ rows }: IdenticalBranchTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
          <caption className="sr-only">
            Branches declared identical to another, with the flow each carries into its junction.
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th scope="col" className={HEADER_CELL}>
                Branch
              </th>
              <th scope="col" className={HEADER_CELL}>
                Identical to
              </th>
              <th scope="col" className={HEADER_CELL}>
                Sprinklers
              </th>
              <th scope="col" className={HEADER_CELL}>
                Reference flow ({UNITS.flow})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Reference pressure ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Junction pressure ({UNITS.pressure})
              </th>
              <th scope="col" className={HEADER_CELL}>
                Scale factor
              </th>
              <th scope="col" className={HEADER_CELL}>
                Flow ({UNITS.flow})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.joinNodeId}<-${row.referenceNodeId}`}
                className="border-b border-zinc-100 dark:border-zinc-800/50"
              >
                <th scope="row" className={`${DATA_CELL} font-medium`}>
                  {branchName(row.joinNodeId)}
                </th>
                <td className={DATA_CELL}>{branchName(row.referenceNodeId)}</td>
                <td className={DATA_CELL}>{row.sprinklerCount}</td>
                <td className={DATA_CELL}>{formatFlow(row.referenceFlowGpm)}</td>
                <td className={DATA_CELL}>{formatPressure(row.referencePressurePsi)}</td>
                <td className={DATA_CELL}>{formatPressure(row.junctionPressurePsi)}</td>
                <td className={DATA_CELL}>{formatAdjustment(row.scaleFactor)}</td>
                <td className={`${DATA_CELL} font-medium text-zinc-900 dark:text-zinc-50`}>
                  {formatFlow(row.flowGpm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        These branches were not listed sprinkler by sprinkler, so they have no rows in the worksheet
        above. Each is the branch it repeats, as worked from its own first sprinkler, scaled to the
        pressure at its own junction; the flow shown is already included in the demand.
      </p>
    </div>
  );
}
