import type { StepProps } from "../../stepProps";

type PathReferenceTablesProps = Pick<StepProps, "hoseNozzles" | "hoseNozzleNote" | "cFactors" | "referenceEdition">;

/** The reference tables under the path step: NFPA 14 Table A.10.2.6 and the Hazen-Williams C values. */
export function PathReferenceTables({ hoseNozzles, hoseNozzleNote, cFactors, referenceEdition }: PathReferenceTablesProps) {
  return (
    <>
      {hoseNozzles.length > 0 && (
        <details className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
            Hose and nozzle combinations, Table A.10.2.6 ({referenceEdition})
          </summary>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{hoseNozzleNote}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-1 pr-3 font-medium">No.</th>
                  <th className="py-1 pr-3 font-medium">Hose and nozzle</th>
                  <th className="py-1 pr-3 text-right font-medium">Outlet pressure, psi</th>
                  <th className="py-1 text-right font-medium">Flow, gpm</th>
                </tr>
              </thead>
              <tbody>
                {hoseNozzles.map((row) => (
                  <tr key={row.number} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                    <td className="py-1.5 pr-3 tabular-nums">
                      {row.number}
                      {row.aboveMinimumResidual ? "*" : ""}
                    </td>
                    <td className="py-1.5 pr-3">
                      {row.hose}
                      {row.nozzle !== null ? `, ${row.nozzle}` : ""}
                      {row.sourceNote !== null && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{row.sourceNote}</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{row.outletPressurePsi}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.flowGpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            * Requires an operating pressure above the minimum required hose connection residual pressure.
          </p>
        </details>
      )}

      {cFactors.length > 0 && (
        <details className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
            Hazen-Williams C values ({referenceEdition})
          </summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
            {cFactors.map((entry) => (
              <li key={entry.pipeType} className="flex justify-between gap-4">
                <span>{entry.label}</span>
                <span className="tabular-nums">{entry.cFactor}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
