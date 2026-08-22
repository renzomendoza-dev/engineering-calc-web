import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function PressureTankFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="Drawdown Volume" tex="V_d = Q \times t_{min}" highlighted />
        <FormulaBlock label="Required Tank Volume" tex="V_t = \dfrac{V_d}{1 - P_{low}/P_{high}}" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Q = drawdown flow rate, t_min = minimum run/sleep time, V_d = drawdown volume, P_low/
        P_high = absolute low/high pressure, V_t = required tank volume.
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The required-volume formula has the same shape as the{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">V_t = V_e / (1 - P_fill/P_max)</code>{" "}
        formula on the thermal expansion tank page — same physics (a fixed volume that must be
        absorbed within a pressure charge), different source of that volume.
      </p>
    </div>
  );
}
