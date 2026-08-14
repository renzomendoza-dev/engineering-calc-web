import { FormulaBlock } from "@/components/ui/FormulaBlock";
import type { PipeSizingMode } from "./types";

interface PipeVelocityFormulaProps {
  mode: PipeSizingMode;
}

export function PipeVelocityFormula({ mode }: PipeVelocityFormulaProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      {mode === "VELOCITY_FROM_DIAMETER" ? (
        <div className="flex flex-col gap-3">
          <FormulaBlock label="Velocity" tex="V = \dfrac{Q}{A}" highlighted />
          <FormulaBlock label="Cross-Sectional Area" tex="A = \dfrac{\pi D^2}{4}" />
        </div>
      ) : (
        <FormulaBlock label="Minimum Diameter" tex="D = \sqrt{\dfrac{4Q}{\pi V}}" highlighted />
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        V = velocity, Q = flow rate, A = cross-sectional area, D = internal diameter.
      </p>
    </div>
  );
}
