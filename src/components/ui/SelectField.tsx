import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  error?: string;
  /** Short guidance shown under the label, e.g. what value to enter or where to find it. */
  hint?: string;
}

/**
 * Labeled select with inline validation error display. Reused across every calculator
 * form for enum-backed fields (CircuitType, wire material, etc.).
 *
 * `hint` renders as always-visible text rather than a hover tooltip, so guidance isn't lost
 * on touch/keyboard-only input.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, hint, id, className, ...selectProps }, ref) => {
    const fieldId = id ?? selectProps.name;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
        <select
          {...selectProps}
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors dark:bg-zinc-950 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700"
          } ${className ?? ""}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
