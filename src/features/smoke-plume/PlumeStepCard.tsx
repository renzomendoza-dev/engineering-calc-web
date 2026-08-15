import { FormulaBlock } from "@/components/ui/FormulaBlock";
import { ResultCard } from "@/components/ui/ResultCard";

interface PlumeStepCardProps {
  step: number;
  title: string;
  formulaLabel: string;
  tex: string;
  substitution: string;
  resultLabel: string;
  value: number;
  unit: string;
  precision?: number;
  badge?: { label: string; className: string };
}

/**
 * One row of the NFPA 92 calculation sequence: the generic formula (via the shared
 * FormulaBlock, same KaTeX component every other calculator uses), the same formula with
 * this calculation's actual numbers substituted in, and the resulting value. Local to this
 * feature — no other calculator page shows substituted-value steps, so this isn't extracted
 * to a shared component.
 */
export function PlumeStepCard({
  step,
  title,
  formulaLabel,
  tex,
  substitution,
  resultLabel,
  value,
  unit,
  precision = 2,
  badge,
}: PlumeStepCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Step {step}: {title}
        </p>
        {badge && (
          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>
      <FormulaBlock label={formulaLabel} tex={tex} />
      <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{substitution}</p>
      <ResultCard label={resultLabel} value={value.toFixed(precision)} unit={unit} />
    </div>
  );
}
