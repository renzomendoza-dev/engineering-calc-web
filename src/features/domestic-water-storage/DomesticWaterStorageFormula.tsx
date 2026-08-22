import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function DomesticWaterStorageFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <FormulaBlock
        label="Required Storage Volume"
        tex="V_{storage} = Q_{demand} \times t_{duration}"
        highlighted
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        V_storage = required storage volume, Q_demand = resolved demand flow rate (from
        occupant count + per-capita consumption, or from fixture units + system type), t_duration
        = storage duration. A safety margin, if set, is applied on top as (1 + margin/100).
      </p>
    </div>
  );
}
