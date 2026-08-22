import { FormulaBlock } from "@/components/ui/FormulaBlock";
import type { DuctShape, DuctSizingMethod } from "./types";

interface DuctSizingFormulaProps {
  shape: DuctShape;
  method: DuctSizingMethod;
}

/**
 * Round+Velocity has a clean closed-form diameter formula. Every other combination (Round+
 * Equal Friction, and both Rectangular cases) is solved iteratively via bisection against the
 * Darcy-Weisbach equation -- honestly labeled as such rather than forcing a formula that
 * doesn't reflect how the answer is actually produced. Rectangular always shows the ASHRAE
 * equivalent-diameter formula regardless of method, since that conversion step is shape-driven,
 * not method-driven.
 */
export function DuctSizingFormula({ shape, method }: DuctSizingFormulaProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>

      <div className="flex flex-col gap-3">
        {shape === "ROUND" ? (
          method === "VELOCITY" ? (
            <FormulaBlock
              label="Diameter from Velocity"
              tex="D = \sqrt{\dfrac{4Q}{\pi V}}"
              highlighted
            />
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Diameter from Target Friction Rate
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Equal Friction sizing has no closed-form diameter formula — the diameter is
                solved iteratively via the Darcy-Weisbach equation until the actual friction
                rate matches your target.
              </p>
            </div>
          )
        ) : (
          <>
            <FormulaBlock
              label="ASHRAE Equivalent Diameter (Rectangular)"
              tex="D_e = \dfrac{1.30(ab)^{0.625}}{(a+b)^{0.25}}"
              highlighted
            />
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Free Dimension
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                With one dimension fixed, the other is solved iteratively via the
                Darcy-Weisbach equation (using the equivalent diameter above) until the actual
                {method === "VELOCITY" ? " velocity matches your target" : " friction rate matches your target"}.
              </p>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        D = round duct diameter, Q = airflow, V = velocity, D_e = equivalent diameter, a/b =
        rectangular duct side lengths.
      </p>
    </div>
  );
}
