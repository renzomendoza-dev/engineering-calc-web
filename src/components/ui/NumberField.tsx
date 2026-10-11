import { forwardRef, type InputHTMLAttributes } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  unit?: string;
  error?: string;
  /** Short guidance shown under the label, e.g. what value to enter or where to find it. */
  hint?: string;
  /** Longer explanation revealed via a "ⓘ" next to the label on hover or click/tap, for
   *  guidance too long to keep permanently visible. Independent of `hint` — use whichever
   *  fits, or both. */
  tooltip?: string;
}

/**
 * Labeled numeric input with inline validation error display. Reused across every
 * calculator form — register it with react-hook-form via the forwarded ref.
 *
 * `hint` renders as always-visible text rather than a hover tooltip, so guidance isn't lost
 * on touch/keyboard-only input. `tooltip` is the opt-in alternative for longer text where
 * always-visible would be too much clutter — its trigger still supports click/tap, not just
 * hover, for the same reason.
 *
 * The input is text-base (16px) below the sm breakpoint: iOS Safari zooms the whole page in when
 * a field smaller than 16px is focused. Same on every text-like field in the app.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, unit, error, hint, tooltip, id, className, ...inputProps }, ref) => {
    const fieldId = id ?? inputProps.name;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {unit && <span className="ml-1 text-zinc-400 dark:text-zinc-500">({unit})</span>}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
        <input
          {...inputProps}
          ref={ref}
          id={fieldId}
          type="number"
          step="any"
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`rounded-md border px-3 py-2 text-base shadow-sm outline-none sm:text-sm transition-colors disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700"
          } bg-white dark:bg-zinc-950 ${className ?? ""}`}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

NumberField.displayName = "NumberField";
