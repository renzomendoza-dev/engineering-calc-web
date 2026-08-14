import { forwardRef, type InputHTMLAttributes } from "react";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  unit?: string;
  error?: string;
}

/**
 * Labeled numeric input with inline validation error display. Reused across every
 * calculator form — register it with react-hook-form via the forwarded ref.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, unit, error, id, className, ...inputProps }, ref) => {
    const fieldId = id ?? inputProps.name;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {unit && <span className="ml-1 text-zinc-400 dark:text-zinc-500">({unit})</span>}
        </label>
        <input
          {...inputProps}
          ref={ref}
          id={fieldId}
          type="number"
          step="any"
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 ${
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
