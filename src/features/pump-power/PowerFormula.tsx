import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function PowerFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="Hydraulic Power" tex="P_{hydraulic} = \dfrac{\rho \, g \, Q \, H}{1000}" />
        <FormulaBlock label="Shaft Power" tex="P_{shaft} = \dfrac{P_{hydraulic}}{\eta}" highlighted />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        ρ = fluid density (kg/m³), g = gravitational acceleration, Q = flow rate (m³/s), H =
        total dynamic head (m), η = pump efficiency (fraction).
      </p>
    </div>
  );
}
