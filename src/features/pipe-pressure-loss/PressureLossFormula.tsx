import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function PressureLossFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="Darcy-Weisbach Head Loss" tex="h_f = f \dfrac{L}{D} \dfrac{V^2}{2g}" highlighted />
        <FormulaBlock label="Reynolds Number" tex="Re = \dfrac{\rho V D}{\mu}" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        h_f = head loss (m), f = friction factor, L = pipe length (m), D = internal diameter
        (m), V = velocity (m/s), g = gravitational acceleration, Re = Reynolds number, ρ = fluid
        density, μ = dynamic viscosity.
      </p>
    </div>
  );
}
