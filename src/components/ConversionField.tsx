"use client";

export interface ConversionFieldOption {
  value: string;
  label: string;
}

interface ConversionFieldProps {
  label: string;
  value: string;
  onValueChange?: (value: string) => void;
  /** When set, the value control renders as a select (e.g. discrete AWG sizes) instead of a number input. */
  valueOptions?: ConversionFieldOption[];
  readOnly?: boolean;
  unit: string;
  onUnitChange: (unit: string) => void;
  unitOptions: ConversionFieldOption[];
}

/** Value + unit input pair reused for both sides of every conversion category. */
export function ConversionField({
  label,
  value,
  onValueChange,
  valueOptions,
  readOnly = false,
  unit,
  onUnitChange,
  unitOptions,
}: ConversionFieldProps) {
  const inputId = `conversion-field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="flex gap-2">
        {valueOptions ? (
          <select
            id={inputId}
            value={value}
            disabled={readOnly}
            onChange={(event) => onValueChange?.(event.target.value)}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-400"
          >
            {valueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            step="any"
            value={value}
            readOnly={readOnly}
            onChange={(event) => onValueChange?.(event.target.value)}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 read-only:bg-zinc-100 read-only:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:read-only:bg-zinc-900 dark:read-only:text-zinc-400"
          />
        )}
        <select
          value={unit}
          onChange={(event) => onUnitChange(event.target.value)}
          className="w-24 rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {unitOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
