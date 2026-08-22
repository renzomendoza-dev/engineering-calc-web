import { FormulaBlock } from "@/components/ui/FormulaBlock";

export function FireWaterStorageFormula() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      <FormulaBlock
        label="Required Storage Volume"
        tex="V_{storage} = Q_{rated} \times t_{duration}"
        highlighted
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        V_storage = required storage volume (gallons), Q_rated = rated fire pump flow (GPM),
        t_duration = duration used (minutes) — either the selected value within the hazard
        classification&apos;s range, or the conservative maximum if none was selected. A safety
        margin, if set, is applied on top as (1 + margin/100).
      </p>
    </div>
  );
}
