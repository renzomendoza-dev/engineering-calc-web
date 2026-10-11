import { forwardRef, type InputHTMLAttributes } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  /** Short guidance shown under the label. */
  hint?: string;
  /** Longer explanation revealed via a "ⓘ" next to the label on hover or click/tap. */
  tooltip?: string;
}

/**
 * Labeled text input with inline validation error display — NumberField's counterpart for the
 * free-text fields a form needs (node identifiers, device names, a project title), with the same
 * label/hint/error structure and the same 16px-below-sm sizing that keeps iOS Safari from zooming.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, tooltip, id, className, ...inputProps }, ref) => {
    const fieldId = id ?? inputProps.name;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
        <input
          {...inputProps}
          ref={ref}
          id={fieldId}
          type="text"
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

TextField.displayName = "TextField";
