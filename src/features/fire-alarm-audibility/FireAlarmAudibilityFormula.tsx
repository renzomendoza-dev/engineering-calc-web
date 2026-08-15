import { FormulaBlock } from "@/components/ui/FormulaBlock";
import type { FireAlarmNotificationMode } from "./types";

interface FireAlarmAudibilityFormulaProps {
  mode: FireAlarmNotificationMode;
}

export function FireAlarmAudibilityFormula({ mode }: FireAlarmAudibilityFormulaProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Formula Reference</h2>
      {mode === "PUBLIC" && (
        <FormulaBlock
          label="Public Mode Threshold (NFPA 72 §18.4.4)"
          tex="T = \max\left(L_{avg} + 15,\ \ L_{max,60s} + 5\right)"
          highlighted
        />
      )}
      {mode === "PRIVATE" && (
        <FormulaBlock
          label="Private Mode Threshold (NFPA 72 §18.4.5)"
          tex="T = \max\left(L_{avg} + 10,\ \ L_{max,60s} + 5\right)"
          highlighted
        />
      )}
      {mode === "SLEEPING" && (
        <FormulaBlock
          label="Sleeping Area Threshold (NFPA 72 §18.4.5.1 / §18.4.5.3)"
          tex="T = \max\left(75,\ \ L_{avg} + 15,\ \ L_{max,60s} + 5\right)"
          highlighted
        />
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        T = required threshold (dB), L_avg = measured average ambient level, L_max,60s =
        measured 60-second max sustained ambient level (candidate skipped if not measured).
        Sleeping areas require a 75 dBA absolute floor at the pillow, overridden upward if the
        public-mode relative rule would demand more.
      </p>
    </div>
  );
}
