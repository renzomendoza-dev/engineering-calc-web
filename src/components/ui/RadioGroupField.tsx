import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface RadioOption {
  value: string;
  label: ReactNode;
}

interface RadioGroupFieldProps extends UseFormRegisterReturn {
  /** The group's name — what question the options answer. Always given, even when hidden. */
  legend: string;
  options: readonly RadioOption[];
  /**
   * Keeps the legend for screen readers but hides it visually, for groups already labelled on
   * screen (e.g. by a section heading directly above) or whose options read as self-explanatory.
   */
  hideLegend?: boolean;
  /** Medium-weight option labels, for groups without a visible legend, where the options act as the heading. */
  emphasizeOptions?: boolean;
  /** Explanatory text shown under the options. */
  hint?: ReactNode;
}

/**
 * A react-hook-form-registered radio group, as a <fieldset>/<legend> so assistive technology
 * announces which question each option answers — plain <label>s around the inputs only name
 * the individual options.
 *
 * Spread register() onto it like any other field: `<RadioGroupField {...register("mode")} … />`.
 * The same registration (name, onChange, onBlur, ref) goes on every option, which is how
 * react-hook-form expects a radio group to be registered.
 */
export function RadioGroupField({
  legend,
  options,
  hideLegend = false,
  emphasizeOptions = false,
  hint,
  ...registration
}: RadioGroupFieldProps) {
  // min-w-0 overrides fieldset's default min-width: min-content, which would otherwise stop the
  // options wrapping on narrow screens. A <legend> isn't laid out as a flex item, so spacing
  // below it is a margin rather than the gap-2 the previous <span> labels used.
  return (
    <fieldset className="min-w-0">
      <legend
        className={
          hideLegend ? "sr-only" : "mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        }
      >
        {legend}
      </legend>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 ${
              emphasizeOptions ? "font-medium" : ""
            }`}
          >
            <input type="radio" value={option.value} className="h-4 w-4" {...registration} />
            {option.label}
          </label>
        ))}
      </div>
      {hint && <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>}
    </fieldset>
  );
}
