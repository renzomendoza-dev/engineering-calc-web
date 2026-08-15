import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function TDHFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <FormulaBlock
        label="Total Dynamic Head"
        tex="TDH = h_{static} + h_{f,suction} + h_{f,discharge} + h_{residual} + h_{velocity}"
        highlighted
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        h_static = static head (discharge elevation vs. suction condition), h_f,suction /
        h_f,discharge = Darcy-Weisbach friction head loss through the suction/discharge piping
        (summed per segment), h_residual = required residual pressure at the outlet expressed
        as head, h_velocity = velocity head at the discharge (only included when selected).
      </p>
    </div>
  );
}
