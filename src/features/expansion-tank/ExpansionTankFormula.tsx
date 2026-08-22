import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function ExpansionTankFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <div className="flex flex-col gap-3">
        <FormulaBlock
          label="Expansion Volume"
          tex="V_e = V_{system} \left(\dfrac{\rho_{cold}}{\rho_{hot}} - 1\right)"
          highlighted
        />
        <FormulaBlock label="Required Tank Volume" tex="V_t = \dfrac{V_e}{1 - P_{fill}/P_{max}}" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        V_system = derived system volume, ρ_cold/ρ_hot = water density at cold/hot temperature,
        V_e = expansion volume, P_fill/P_max = absolute fill/max operating pressure, V_t =
        required tank volume.
      </p>
    </div>
  );
}
