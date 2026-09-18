import type { ReactNode } from "react";

type Tone = "blue" | "emerald";

const TONE_CLASSES: Record<Tone, { box: string; value: string; muted: string }> = {
  blue: {
    box: "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40",
    value: "text-blue-900 dark:text-blue-100",
    muted: "text-blue-700 dark:text-blue-400",
  },
  emerald: {
    box: "border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40",
    value: "text-emerald-900 dark:text-emerald-100",
    muted: "text-emerald-700 dark:text-emerald-400",
  },
};

interface HeadlineResultProps {
  label: string;
  value: ReactNode;
  /** Shown smaller, after the value. Omit when the value already includes its unit. */
  unit?: string;
  /** The same quantity in another unit, e.g. "1,000 liters" under a m³ headline. */
  secondaryValue?: ReactNode;
  /** A short explanatory footnote. */
  note?: ReactNode;
  /** Blue by default; emerald sets a second headline apart from the first (e.g. cost vs. energy). */
  tone?: Tone;
}

/**
 * The one answer a calculator exists to produce, shown above its supporting ResultCards.
 * Every results panel with a single headline figure uses this, so they all look the same.
 */
export function HeadlineResult({
  label,
  value,
  unit,
  secondaryValue,
  note,
  tone = "blue",
}: HeadlineResultProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div className={`rounded-lg border p-6 text-center ${classes.box}`}>
      <p className={`text-sm font-medium ${classes.muted}`}>{label}</p>
      <p className={`mt-1 text-4xl font-bold ${classes.value}`}>
        {value}
        {unit && <span className={`ml-1 text-lg font-normal ${classes.muted}`}>{unit}</span>}
      </p>
      {secondaryValue && <p className={`mt-1 text-sm ${classes.muted}`}>{secondaryValue}</p>}
      {note && <p className={`mt-2 text-xs ${classes.muted}`}>{note}</p>}
    </div>
  );
}
