import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function PowerFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="Water Horsepower" tex="WHP = \dfrac{Q \times H \times SG}{3960}" />
        <FormulaBlock label="Brake Horsepower" tex="BHP = \dfrac{WHP}{\eta}" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Q = flow (GPM), H = head (ft, from pressure), SG = specific gravity, η = pump efficiency
        (fraction).
      </p>
    </div>
  );
}
