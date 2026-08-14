import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function DemandFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock label="Flooded Suction" tex="P_{rated} = P_{demand} - P_{suction}" />
        <FormulaBlock label="Suction Lift" tex="P_{rated} = P_{demand} + (h_{lift} \times 0.433)" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        P_rated = rated pressure (psi), P_demand = required pressure at demand point (psi),
        P_suction = available suction pressure (psi), h_lift = suction lift (ft).
      </p>
    </div>
  );
}
