import { FormulaBlock } from "@/components/ui/FormulaBlock";

/**
 * The formulas the backend works from, as reference. Collapsed by default — a designer checking a
 * sheet wants them, a designer entering a network does not.
 *
 * These are shown with symbols only, never with this calculation's numbers substituted in: the
 * figures on screen come from the API, and a worked example rendered here would be the browser
 * doing hydraulics, which is exactly what this feature does not do. Each one was checked against
 * the API's own output for the documented test case before being written down.
 */
export function SprinklerFormulas() {
  return (
    <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Formulas used
      </summary>

      <div className="flex flex-col gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <FormulaBlock
          label="Sprinkler discharge"
          tex="Q = K\sqrt{P}"
          description="Flow from one sprinkler, in gpm, from its K factor and the pressure at it, in psi. The most remote sprinkler starts at the greater of the pressure its flow needs and the minimum operating pressure; every sprinkler after it discharges at whatever pressure the network gives it."
        />
        <FormulaBlock
          label="Hazen-Williams friction loss"
          tex="p = \dfrac{4.52\,Q^{1.85}}{C^{1.85}\,d^{4.87}}"
          description="Friction loss in psi per foot of pipe, for flow Q in gpm, Hazen-Williams coefficient C, and actual inside diameter d in inches. Multiplied by the segment's total length — pipe plus fitting equivalent lengths — to give that segment's loss."
        />
        <FormulaBlock
          label="Elevation pressure"
          tex="p = 0.433\,h"
          description="Pressure in psi needed to lift water h feet: 0.433 psi per foot of height. Positive where the downstream node is higher, negative where the supply sits above the sprinklers."
        />
        <FormulaBlock
          label="Fitting equivalent length, adjusted for the pipe's C factor"
          tex="L_C = L_{120}\left(\dfrac{C}{120}\right)^{1.85}"
          description="NFPA 13 publishes fitting equivalent lengths in feet of C = 120 pipe, and requires rescaling them for pipe with a different C: 0.713 at C = 100, 1.16 at C = 130, 1.33 at C = 140, 1.51 at C = 150. The direction catches people out — a fitting's own loss barely depends on the pipe it sits in, so in rougher pipe (lower C, more loss per foot) it takes fewer feet of that pipe to match the fitting. Applied to chart lookups only: an equivalent length you type in yourself is used exactly as entered, because its basis isn't known."
        />
        <FormulaBlock
          label="Water supply curve"
          tex="P_{avail} = P_{static} - (P_{static} - P_{residual})\left(\dfrac{Q}{Q_{test}}\right)^{1.85}"
          description="Pressure the supply can still deliver at flow Q, fitted through the flow test: static pressure, and the residual pressure measured at the test flow Q_test. The safety margin is this pressure at the demand flow, less the pressure the system requires."
        />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Reference data and method: NFPA 13, <i>Standard for the Installation of Sprinkler
          Systems</i>, 2019 edition — fitting equivalent lengths from Table 27.2.3.1.1 (Equivalent
          Schedule 40 Steel Pipe Length Chart), Hazen-Williams C factors from Table A.27.2.4.8.2,
          and the hazard presets from the density/area curves and hose stream tables. Check any
          value flagged in a warning against your own copy of the standard before relying on it.
        </p>
      </div>
    </details>
  );
}
